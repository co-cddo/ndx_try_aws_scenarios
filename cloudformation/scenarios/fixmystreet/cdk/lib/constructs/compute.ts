import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly databaseCluster: rds.IDatabaseCluster;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly fileSystem: efs.IFileSystem;
  readonly accessPoint: efs.IAccessPoint;
  readonly adminSecret: secretsmanager.ISecret;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly logGroup: logs.ILogGroup;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxFms-Cluster',
    });

    // CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-fixmystreet/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Execution Role — ISB SCP compliant name
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-fms-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    props.databaseSecret.grantRead(executionRole);
    props.adminSecret.grantRead(executionRole);

    // Task Role — ISB SCP compliant name
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-fms-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      }),
    );

    props.databaseSecret.grantRead(taskRole);
    props.fileSystem.grantRootAccess(taskRole);

    // Fargate Task Definition — 1 vCPU, 2GB
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
    });

    // EFS volume for photo uploads
    this.taskDefinition.addVolume({
      name: 'fms-uploads',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        authorizationConfig: {
          accessPointId: props.accessPoint.accessPointId,
          iam: 'ENABLED',
        },
        transitEncryption: 'ENABLED',
      },
    });

    // Main FixMyStreet container (Perl/Catalyst app on port 9000)
    const fmsContainer = this.taskDefinition.addContainer('fixmystreet', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-fixmystreet:latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'fms',
      }),
      environment: {
        DB_HOST: props.databaseCluster.clusterEndpoint.hostname,
        DB_PORT: props.databaseCluster.clusterEndpoint.port.toString(),
        DB_NAME: 'fixmystreet',
        DB_USER: props.databaseSecret.secretValueFromJson('username').unsafeUnwrap(),
        DB_PASSWORD: props.databaseSecret.secretValueFromJson('password').unsafeUnwrap(),
        ADMIN_PASSWORD: props.adminSecret.secretValueFromJson('password').unsafeUnwrap(),
        ADMIN_EMAIL: 'admin@example.org',
        FMS_MEMCACHE_HOST: 'localhost',
        FMS_ROOT: '/var/www/fixmystreet/fixmystreet',
      },
      portMappings: [
        {
          containerPort: 9000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:9000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
      essential: true,
    });

    // Mount EFS volume for uploads
    fmsContainer.addMountPoints({
      sourceVolume: 'fms-uploads',
      containerPath: '/var/www/fixmystreet/fixmystreet/upload_dir',
      readOnly: false,
    });

    // Nginx sidecar — reverse proxy port 80 → FMS port 9000
    // Uses a custom nginx.conf injected via ECS container command
    this.taskDefinition.addContainer('nginx', {
      image: ecs.ContainerImage.fromRegistry('nginx:1.27-alpine'),
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'nginx',
      }),
      // Inline nginx config — avoids needing a separate config file in S3/EFS
      command: [
        '/bin/sh', '-c',
        `cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 10m;
    gzip on;
    gzip_types application/javascript text/css;
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_redirect off;
    }
    location /mapit/ {
        proxy_pass https://mapit.mysociety.org/;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX
exec nginx -g 'daemon off;'`,
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/health || exit 1'],
        interval: cdk.Duration.seconds(15),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(10),
      },
      essential: true,
    });

    // Memcached sidecar
    this.taskDefinition.addContainer('memcached', {
      image: ecs.ContainerImage.fromRegistry('memcached:1.6-alpine'),
      memoryLimitMiB: 128,
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'memcached',
      }),
      essential: true,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxFms-ALB',
    });

    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // Fargate Service
    this.service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
      serviceName: 'NdxFms-Service',
      healthCheckGracePeriod: cdk.Duration.minutes(10),
    });

    httpListener.addTargets('FmsTarget', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service.loadBalancerTarget({
        containerName: 'nginx',
        containerPort: 80,
      })],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200-399',
      },
    });
  }
}
