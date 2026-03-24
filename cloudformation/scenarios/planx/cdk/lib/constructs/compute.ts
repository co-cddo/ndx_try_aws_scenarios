import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface PlanxResolvedSecrets {
  readonly jwtSecret: string;
  readonly hasuraAdminSecret: string;
  readonly sessionSecret: string;
  readonly encryptionKey: string;
  readonly demoPassword: string;
}

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly databaseCluster: rds.IDatabaseCluster;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly uploadsBucket: s3.IBucket;
  readonly secrets: PlanxResolvedSecrets;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxPlanx-Cluster',
    });

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-planx/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Roles — ISB SCP requires InnovationSandbox-ndx-* prefix
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-planx-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
    props.databaseSecret.grantRead(executionRole);

    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-planx-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    props.uploadsBucket.grantReadWrite(taskRole);
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [logGroup.logGroupArn],
      }),
    );

    // Database connection strings
    const dbHost = props.databaseCluster.clusterEndpoint.hostname;
    const dbPort = props.databaseCluster.clusterEndpoint.port.toString();
    const dbUser = props.databaseSecret.secretValueFromJson('username').unsafeUnwrap();
    const dbPassword = props.databaseSecret.secretValueFromJson('password').unsafeUnwrap();

    const databaseUrl = cdk.Fn.join('', [
      'postgres://', dbUser, ':', dbPassword, '@', dbHost, ':', dbPort, '/planxdb',
    ]);

    // GHCR image references — public images built by GitHub Actions
    const ghcrPrefix = 'ghcr.io/co-cddo/ndx_try_aws_scenarios-planx';

    // ALB — single load balancer, path-based routing
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxPlanx-ALB',
    });

    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // =========================================================================
    // Shared environment for Hasura, API, ShareDB
    // =========================================================================
    const sharedEnv: Record<string, string> = {
      PG_HOST: dbHost,
      PG_PORT: dbPort,
      PG_USERNAME: dbUser,
      PG_PASSWORD: dbPassword,
      PG_DATABASE: 'planxdb',
      DATABASE_URL: databaseUrl,
      JWT_SECRET: props.secrets.jwtSecret,
      NODE_ENV: 'production',
    };

    // =========================================================================
    // 1. Hasura (engine + Caddy proxy as sidecar)
    // =========================================================================
    const hasuraTaskDef = new ecs.FargateTaskDefinition(this, 'HasuraTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Hasura calls API via ALB (internal path)
    const hasuraApiUrl = cdk.Fn.join('', ['http://', this.loadBalancer.loadBalancerDnsName, '/api']);

    // Custom Hasura image includes entrypoint-wrapper.sh that:
    // 1. Waits for Aurora DNS to resolve
    // 2. Waits for PostgreSQL to accept connections
    // 3. Pre-creates extensions (postgis, pgcrypto, fuzzystrmatch, pg_cron, etc.)
    // 4. Then runs the standard Hasura cli-migrations entrypoint
    hasuraTaskDef.addContainer('hasura-engine', {
      image: ecs.ContainerImage.fromRegistry(`${ghcrPrefix}-hasura:latest`),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'hasura' }),
      environment: {
        HASURA_GRAPHQL_DATABASE_URL: databaseUrl,
        HASURA_GRAPHQL_ADMIN_SECRET: props.secrets.hasuraAdminSecret,
        HASURA_GRAPHQL_JWT_SECRET: `{"type":"HS256","key":"${props.secrets.jwtSecret}"}`,
        HASURA_GRAPHQL_UNAUTHORIZED_ROLE: 'public',
        HASURA_GRAPHQL_ENABLE_CONSOLE: 'true',
        HASURA_GRAPHQL_DEV_MODE: 'false',
        HASURA_GRAPHQL_ENABLED_LOG_TYPES: 'startup,http-log,webhook-log,websocket-log,query-log',
        HASURA_GRAPHQL_CONSOLE_ASSETS_DIR: '/srv/console-assets',
        HASURA_GRAPHQL_MIGRATIONS_SERVER_TIMEOUT: '180',
        HASURA_GRAPHQL_CORS_DOMAIN: '*',
        HASURA_PLANX_API_URL: hasuraApiUrl,
        HASURA_PLANX_API_KEY: props.secrets.sessionSecret,
      },
      portMappings: [{ containerPort: 8080, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/healthz || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    // No Caddy sidecar needed — ALB routes Hasura paths directly to port 8080
    // Hasura's native paths (/v1/*, /v2/*, /console/*, /healthz) don't collide with the editor

    const hasuraService = new ecs.FargateService(this, 'HasuraService', {
      cluster: this.cluster,
      taskDefinition: hasuraTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxPlanx-Hasura',
      healthCheckGracePeriod: cdk.Duration.minutes(15),
    });

    // =========================================================================
    // 2. API (Node.js Express with demo auth)
    // =========================================================================
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Boot script: wait for Hasura, then start API
    const apiBootScript = [
      'echo "Waiting for Hasura..."',
      'until wget -q --spider http://localhost:8080/healthz 2>/dev/null || curl -sf http://$HASURA_HOST:8080/healthz >/dev/null 2>&1; do echo "Hasura not ready..."; sleep 5; done',
      'echo "Hasura ready. Starting API..."',
      'exec npm start',
    ].join(' && ');

    apiTaskDef.addContainer('api', {
      image: ecs.ContainerImage.fromRegistry(`${ghcrPrefix}-api:latest`),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'api' }),
      environment: {
        ...sharedEnv,
        PORT: '7002',
        APP_ENVIRONMENT: 'development',
        SESSION_SECRET: props.secrets.sessionSecret,
        ENCRYPTION_KEY: props.secrets.encryptionKey,
        HASURA_GRAPHQL_ADMIN_SECRET: props.secrets.hasuraAdminSecret,
        HASURA_PLANX_API_KEY: props.secrets.sessionSecret,
        // API reaches Hasura via ALB (no prefix — Hasura native paths)
        HASURA_GRAPHQL_URL: cdk.Fn.join('', ['http://', this.loadBalancer.loadBalancerDnsName, '/v1/graphql']),
        EDITOR_URL_EXT: cdk.Fn.join('', ['http://', this.loadBalancer.loadBalancerDnsName]),
        API_URL_EXT: cdk.Fn.join('', ['http://', this.loadBalancer.loadBalancerDnsName, '/api']),
        LPS_URL_EXT: 'https://www.localplanning.services',
        AWS_S3_BUCKET: props.uploadsBucket.bucketName,
        AWS_S3_REGION: cdk.Aws.REGION,
        // PlanX uses explicit AWS credentials for S3 (not IAM task role)
        // Set to non-empty placeholders to pass startup assertions
        // File upload feature is disabled in demo mode
        AWS_ACCESS_KEY: 'demo-placeholder',
        AWS_SECRET_KEY: 'demo-placeholder',
        DEMO_MODE: 'true',
        DEMO_PASSWORD: props.secrets.demoPassword,
        // File API keys — required by auth middleware, dummy values for demo
        FILE_API_KEY: 'ndx-demo-file-api-key',
        FILE_API_KEY_BARNET: 'ndx-demo-barnet',
        FILE_API_KEY_CAMDEN: 'ndx-demo-camden',
        FILE_API_KEY_DONCASTER: 'ndx-demo-doncaster',
        FILE_API_KEY_EPSOM_EWELL: 'ndx-demo-epsom-ewell',
        FILE_API_KEY_GATESHEAD: 'ndx-demo-gateshead',
        FILE_API_KEY_GLOUCESTER: 'ndx-demo-gloucester',
        FILE_API_KEY_LAMBETH: 'ndx-demo-lambeth',
        FILE_API_KEY_MEDWAY: 'ndx-demo-medway',
        FILE_API_KEY_NEXUS: 'ndx-demo-nexus',
        FILE_API_KEY_SOUTHWARK: 'ndx-demo-southwark',
        FILE_API_KEY_TEWKESBURY: 'ndx-demo-tewkesbury',
        // Dummy keys for integrations not used in demo
        GOVUK_NOTIFY_API_KEY: 'test-00000000-0000-0000-0000-000000000000-00000000-0000-0000-0000-000000000000',
        ORDNANCE_SURVEY_API_KEY: '',
        GOOGLE_CLIENT_ID: 'unused',
        GOOGLE_CLIENT_SECRET: 'unused',
        MICROSOFT_CLIENT_ID: 'unused',
        MICROSOFT_CLIENT_SECRET: 'unused',
        UNIFORM_TOKEN_URL: 'https://unused.example.com',
        UNIFORM_SUBMISSION_URL: 'https://unused.example.com',
        IDOX_NEXUS_TOKEN_URL: 'https://unused.example.com',
        IDOX_NEXUS_SUBMISSION_URL: 'https://unused.example.com',
        SLACK_WEBHOOK_URL: 'https://unused.example.com',
        METABASE_API_KEY: 'unused',
        METABASE_URL_EXT: 'https://unused.example.com',
        RESEND_API_KEY: 're_testing_key',
      },
      portMappings: [{ containerPort: 7002, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        // Alpine Node images don't have curl; use wget
        command: ['CMD-SHELL', 'wget -q --spider http://localhost:7002/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120),
      },
    });

    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster: this.cluster,
      taskDefinition: apiTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxPlanx-API',
      healthCheckGracePeriod: cdk.Duration.minutes(10),
    });

    // =========================================================================
    // 3. ShareDB (WebSocket server for collaborative editing)
    // =========================================================================
    const sharedbTaskDef = new ecs.FargateTaskDefinition(this, 'ShareDbTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    sharedbTaskDef.addContainer('sharedb', {
      image: ecs.ContainerImage.fromRegistry(`${ghcrPrefix}-sharedb:latest`),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'sharedb' }),
      environment: {
        ...sharedEnv,
        PORT: '8000',
        HASURA_GRAPHQL_ADMIN_SECRET: props.secrets.hasuraAdminSecret,
        // ShareDB requires API_URL_EXT (for JWT validation) and PG_URL (not DATABASE_URL)
        API_URL_EXT: cdk.Fn.join('', ['http://', this.loadBalancer.loadBalancerDnsName, '/api']),
        PG_URL: databaseUrl,
      },
      portMappings: [{ containerPort: 8000, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        // ShareDB is WebSocket-only; just check the port is listening
        command: ['CMD-SHELL', 'wget -q --spider http://localhost:8000/ 2>&1 || true'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const sharedbService = new ecs.FargateService(this, 'ShareDbService', {
      cluster: this.cluster,
      taskDefinition: sharedbTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxPlanx-ShareDB',
      healthCheckGracePeriod: cdk.Duration.minutes(5),
    });

    // =========================================================================
    // 4. Editor (nginx serving pre-built SPA with runtime config injection)
    // =========================================================================
    const editorTaskDef = new ecs.FargateTaskDefinition(this, 'EditorTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    editorTaskDef.addContainer('editor', {
      image: ecs.ContainerImage.fromRegistry(`${ghcrPrefix}-editor:latest`),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'editor' }),
      environment: {
        // Editor SPA uses relative paths for API/Hasura and window.location.host for WebSockets
        // No external host config needed — all services behind same ALB/CloudFront
        NGINX_PORT: '80',
      },
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'wget -q --spider http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    const editorService = new ecs.FargateService(this, 'EditorService', {
      cluster: this.cluster,
      taskDefinition: editorTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxPlanx-Editor',
      healthCheckGracePeriod: cdk.Duration.minutes(5),
    });

    // =========================================================================
    // ALB Target Groups + Path-Based Routing
    // =========================================================================

    // Default: Editor (port 80)
    httpListener.addTargets('EditorTarget', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [editorService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200,304',
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      priority: 100, // lowest priority = default
    });

    // Hasura native paths → Hasura engine directly on port 8080 (no Caddy proxy)
    // Hasura's paths (/v1/*, /v2/*, /console/*, /healthz) don't collide with editor SPA
    httpListener.addTargets('HasuraTarget', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [hasuraService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/healthz',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/v1/*', '/v2/*', '/console/*', '/healthz'])],
      priority: 10,
    });

    // /api/* → API (Express on port 7002)
    httpListener.addTargets('ApiTarget', {
      port: 7002,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [apiService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/api/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200,404',
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api', '/api/*'])],
      priority: 20,
    });

    // /sharedb → ShareDB WebSocket (port 8000)
    httpListener.addTargets('ShareDbTarget', {
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [sharedbService],
      deregistrationDelay: cdk.Duration.seconds(30),
      stickinessCookieDuration: cdk.Duration.hours(1),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200,426',
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/sharedb', '/sharedb/*'])],
      priority: 30,
    });

    // =========================================================================
    // Outputs
    // =========================================================================
    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for PlanX containers',
      value: `https://${cdk.Aws.REGION}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#logsV2:log-groups/log-group/${encodeURIComponent('/ndx-planx/production')}`,
    });
  }
}
