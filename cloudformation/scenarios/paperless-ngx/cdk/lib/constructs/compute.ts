import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface S3FilesAccessPointHandle {
  readonly id: string;
  readonly path: string;
}

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly databaseInstance: rds.DatabaseInstance;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly redisUrl: string;
  /** S3 Files file system ARN (or fs-id). */
  readonly fileSystemArn: string;
  readonly dataAccessPoint: S3FilesAccessPointHandle;
  readonly mediaAccessPoint: S3FilesAccessPointHandle;
  readonly consumeAccessPoint: S3FilesAccessPointHandle;
  readonly exportAccessPoint: S3FilesAccessPointHandle;
  readonly scriptsAccessPoint: S3FilesAccessPointHandle;
  readonly kbAccessPoint: S3FilesAccessPointHandle;
  readonly adminPassword: string;
  readonly secretKey: string;
  /** Single shared archive bucket — Paperless storage and Bedrock KB data source. */
  readonly archiveBucket: s3.IBucket;
  readonly kbPrefix: string;
  readonly knowledgeBaseId: string;
  readonly bedrockModelId: string;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly logGroup: logs.LogGroup;
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxPaperless-Cluster',
      containerInsights: false,
    });

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-paperless-ngx/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Paperless-ngx Fargate task role (Bedrock + S3 archive + S3 Files)',
    });

    const region = cdk.Stack.of(this).region;
    const stackName = cdk.Stack.of(this).stackName;

    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream', 'bedrock:Converse'],
      resources: [
        `arn:aws:bedrock:${region}::foundation-model/${props.bedrockModelId}`,
        `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0`,
        `arn:aws:bedrock:${region}:*:inference-profile/*`,
      ],
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [props.archiveBucket.bucketArn, `${props.archiveBucket.bucketArn}/*`],
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:StartIngestionJob', 'bedrock:GetIngestionJob', 'bedrock:ListDataSources'],
      resources: ['*'],
    }));

    // S3 Files mount permissions for the task role.
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3files:DescribeFileSystems',
        's3files:DescribeMountTargets',
        's3files:DescribeAccessPoints',
        's3files:ClientMount',
        's3files:ClientWrite',
        's3files:ClientRootAccess',
      ],
      resources: ['*'],
    }));

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 2048,
      memoryLimitMiB: 4096,
      taskRole,
      executionRole,
    });

    // Volumes — all S3 Files. CDK has no native L2 yet, so register placeholder
    // volumes via addVolume and overwrite them via property override below.
    const volumeName = (n: string) => `vol-${n}`;
    const volumeNames = ['data', 'media', 'consume', 'export', 'scripts', 'kb'];
    for (const n of volumeNames) {
      this.taskDefinition.addVolume({ name: volumeName(n) });
    }

    const cfnTaskDef = this.taskDefinition.node.defaultChild as ecs.CfnTaskDefinition;
    const apMap: Record<string, S3FilesAccessPointHandle> = {
      data: props.dataAccessPoint,
      media: props.mediaAccessPoint,
      consume: props.consumeAccessPoint,
      export: props.exportAccessPoint,
      scripts: props.scriptsAccessPoint,
      kb: props.kbAccessPoint,
    };
    cfnTaskDef.addPropertyOverride('Volumes', volumeNames.map(n => ({
      Name: volumeName(n),
      S3FilesVolumeConfiguration: {
        FileSystemArn: props.fileSystemArn,
        AccessPointArn: apMap[n].id,
      },
    })));

    // Bundle post-consume.py and sample-docs-gen.py at synth time.
    const scriptsDir = path.join(__dirname, '..', '..', 'scripts');
    const postConsumePy = fs.readFileSync(path.join(scriptsDir, 'post-consume.py'), 'utf8');
    const sampleDocsGenPy = fs.readFileSync(path.join(scriptsDir, 'sample-docs-gen.py'), 'utf8');

    const initScript = renderInitScript(postConsumePy, sampleDocsGenPy);

    const initContainer = this.taskDefinition.addContainer('init', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/python:3.12-slim'),
      essential: false,
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'init' }),
      command: ['/bin/sh', '-c', initScript],
      memoryReservationMiB: 256,
    });
    initContainer.addMountPoints(
      { sourceVolume: volumeName('scripts'), containerPath: '/efs/scripts', readOnly: false },
      { sourceVolume: volumeName('consume'), containerPath: '/efs/consume', readOnly: false },
      { sourceVolume: volumeName('kb'), containerPath: '/efs/kb', readOnly: false },
    );

    const tikaContainer = this.taskDefinition.addContainer('tika', {
      image: ecs.ContainerImage.fromRegistry('docker.io/apache/tika:latest'),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'tika' }),
      portMappings: [{ containerPort: 9998, protocol: ecs.Protocol.TCP }],
      memoryReservationMiB: 512,
    });

    const gotenbergContainer = this.taskDefinition.addContainer('gotenberg', {
      image: ecs.ContainerImage.fromRegistry('docker.io/gotenberg/gotenberg:8'),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'gotenberg' }),
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      memoryReservationMiB: 256,
      command: [
        'gotenberg',
        '--chromium-disable-javascript=true',
        '--chromium-allow-list=file:///tmp/.*',
      ],
    });

    const dbHost = props.databaseInstance.instanceEndpoint.hostname;
    const dbPort = cdk.Token.asString(props.databaseInstance.instanceEndpoint.port);
    const dbUser = props.databaseSecret.secretValueFromJson('username').unsafeUnwrap();
    const dbPass = props.databaseSecret.secretValueFromJson('password').unsafeUnwrap();

    const paperlessContainer = this.taskDefinition.addContainer('paperless', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/paperless-ngx/paperless-ngx:latest'),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'paperless' }),
      portMappings: [{ containerPort: 8000, protocol: ecs.Protocol.TCP }],
      memoryReservationMiB: 2048,
      environment: {
        PAPERLESS_DBHOST: dbHost,
        PAPERLESS_DBPORT: dbPort,
        PAPERLESS_DBNAME: 'paperless',
        PAPERLESS_DBUSER: dbUser,
        PAPERLESS_DBPASS: dbPass,
        PAPERLESS_REDIS: props.redisUrl,
        PAPERLESS_TIKA_ENABLED: '1',
        PAPERLESS_TIKA_ENDPOINT: 'http://localhost:9998',
        PAPERLESS_TIKA_GOTENBERG_ENDPOINT: 'http://localhost:3000',
        PAPERLESS_ADMIN_USER: 'admin',
        PAPERLESS_ADMIN_MAIL: 'admin@example.com',
        PAPERLESS_ADMIN_PASSWORD: props.adminPassword,
        PAPERLESS_SECRET_KEY: props.secretKey,
        PAPERLESS_OCR_LANGUAGE: 'eng',
        PAPERLESS_PROXY_SSL_HEADER: '["HTTP_X_FORWARDED_PROTO", "https"]',
        PAPERLESS_USE_X_FORWARD_HOST: 'true',
        PAPERLESS_USE_X_FORWARD_PORT: 'true',
        PAPERLESS_CSRF_TRUSTED_ORIGINS: 'https://*.cloudfront.net,https://*.amazonaws.com',
        PAPERLESS_ALLOWED_HOSTS: '*',
        PAPERLESS_TIME_ZONE: 'Europe/London',
        PAPERLESS_POST_CONSUME_SCRIPT: '/scripts/post-consume.sh',
        PAPERLESS_BEDROCK_REGION: region,
        PAPERLESS_BEDROCK_MODEL_ID: props.bedrockModelId,
        PAPERLESS_ARCHIVE_BUCKET: props.archiveBucket.bucketName,
        PAPERLESS_KB_PREFIX: props.kbPrefix,
        PAPERLESS_KB_LOCAL_DIR: '/kb',
        PAPERLESS_KNOWLEDGE_BASE_ID: props.knowledgeBaseId,
        PAPERLESS_STACK_NAME: stackName,
        PAPERLESS_API_URL: 'http://localhost:8000/api',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8000/api/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 10,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    paperlessContainer.addMountPoints(
      { sourceVolume: volumeName('data'), containerPath: '/usr/src/paperless/data', readOnly: false },
      { sourceVolume: volumeName('media'), containerPath: '/usr/src/paperless/media', readOnly: false },
      { sourceVolume: volumeName('consume'), containerPath: '/usr/src/paperless/consume', readOnly: false },
      { sourceVolume: volumeName('export'), containerPath: '/usr/src/paperless/export', readOnly: false },
      { sourceVolume: volumeName('scripts'), containerPath: '/scripts', readOnly: false },
      { sourceVolume: volumeName('kb'), containerPath: '/kb', readOnly: false },
    );

    paperlessContainer.addContainerDependencies(
      { container: initContainer, condition: ecs.ContainerDependencyCondition.SUCCESS },
      { container: tikaContainer, condition: ecs.ContainerDependencyCondition.START },
      { container: gotenbergContainer, condition: ecs.ContainerDependencyCondition.START },
    );

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup as ec2.SecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'not found',
      }),
    });

    this.service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      securityGroups: [props.fargateSecurityGroup as ec2.SecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      healthCheckGracePeriod: cdk.Duration.seconds(900),
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      enableExecuteCommand: true,
    });

    httpListener.addTargets('Paperless', {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service.loadBalancerTarget({
        containerName: 'paperless',
        containerPort: 8000,
      })],
      healthCheck: {
        path: '/api/',
        healthyHttpCodes: '200,302,401,403',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        unhealthyThresholdCount: 5,
        healthyThresholdCount: 2,
      },
      deregistrationDelay: cdk.Duration.seconds(15),
    });
  }
}

function renderInitScript(postConsumePy: string, sampleDocsGenPy: string): string {
  const POST = 'POSTCONSUME_EOF_NDX';
  const GEN = 'SAMPLEGEN_EOF_NDX';
  if (postConsumePy.includes(POST) || sampleDocsGenPy.includes(GEN)) {
    throw new Error('init heredoc delimiter collision — pick different sentinels');
  }
  return `set -eu
echo "[init] Installing init-container dependencies (reportlab + python-docx for sample doc generation)"
apt-get update -qq && apt-get install -y -qq curl >/dev/null
pip install --quiet --no-cache-dir reportlab python-docx
echo "[init] Writing post-consume helpers to /efs/scripts"
mkdir -p /efs/scripts /efs/kb
cat >/efs/scripts/post-consume.sh <<'WRAPSH'
#!/bin/sh
set -eu
if [ ! -f /scripts/.deps-installed ]; then
  /usr/local/bin/pip install --quiet --no-cache-dir boto3 requests >/dev/null 2>&1 || true
  touch /scripts/.deps-installed
fi
exec /usr/local/bin/python3 /scripts/post-consume.py "$@"
WRAPSH
chmod 755 /efs/scripts/post-consume.sh
cat >/efs/scripts/post-consume.py <<'${POST}'
${postConsumePy}
${POST}
chmod 755 /efs/scripts/post-consume.py
cat >/tmp/sample-docs-gen.py <<'${GEN}'
${sampleDocsGenPy}
${GEN}
echo "[init] Seeding sample docs (v3 marker — S3 Files refactor)"
if [ ! -f /efs/consume/.seeded-v4 ]; then
  rm -f /efs/consume/.seeded /efs/consume/.seeded-v2 /efs/consume/.seeded-v3
  python3 /tmp/sample-docs-gen.py
  touch /efs/consume/.seeded-v4
else
  echo "[init] /efs/consume/.seeded-v4 present, skipping sample docs"
fi
echo "[init] Done"
`;
}
