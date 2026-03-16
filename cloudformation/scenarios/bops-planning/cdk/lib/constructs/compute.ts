import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BopsResolvedSecrets {
  readonly secretKeyBase: string;
  readonly otpSecretEncryptionKey: string;
  readonly arePrimaryKey: string;
  readonly areDeterministicKey: string;
  readonly areKeySalt: string;
  readonly adminPassword: string;
  readonly apiBearer: string;
}

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly databaseCluster: rds.IDatabaseCluster;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly redisUrl: string;
  readonly uploadsBucket: s3.IBucket;
  readonly secrets: BopsResolvedSecrets;
  readonly osMapApiKeyParam: cdk.CfnParameter;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly loadBalancerDnsName: string;
  public readonly logGroup: logs.ILogGroup;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxBops-Cluster',
    });

    // CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-bops/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================================================
    // IAM Roles — ISB SCP requires InnovationSandbox-ndx-* prefix
    // ==========================================================================
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-bops-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    props.databaseSecret.grantRead(executionRole);

    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-bops-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // S3 permissions for Active Storage
    props.uploadsBucket.grantReadWrite(taskRole);

    // CloudWatch Logs permissions
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      }),
    );

    // ==========================================================================
    // Shared environment variables
    // ==========================================================================
    const dbHost = props.databaseCluster.clusterEndpoint.hostname;
    const dbPort = props.databaseCluster.clusterEndpoint.port.toString();
    const dbUser = props.databaseSecret.secretValueFromJson('username').unsafeUnwrap();
    const dbPassword = props.databaseSecret.secretValueFromJson('password').unsafeUnwrap();

    const bopsSecretKeyBase = props.secrets.secretKeyBase;
    const otpSecretKey = props.secrets.otpSecretEncryptionKey;
    const arePrimaryKey = props.secrets.arePrimaryKey;
    const areDeterministicKey = props.secrets.areDeterministicKey;
    const areKeySalt = props.secrets.areKeySalt;
    const adminPassword = props.secrets.adminPassword;
    const apiBearer = props.secrets.apiBearer;

    // BOPS uses postgres:// scheme — Rails postgis adapter is configured in database.yml
    const databaseUrl = cdk.Fn.join('', [
      'postgres://', dbUser, ':', dbPassword, '@', dbHost, ':', dbPort, '/bops_production',
    ]);

    const applicantsDatabaseUrl = cdk.Fn.join('', [
      'postgres://', dbUser, ':', dbPassword, '@', dbHost, ':', dbPort, '/bops_applicants_production',
    ]);

    // ==========================================================================
    // Application Load Balancer
    // ==========================================================================
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxBops-ALB',
    });

    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    // Common BOPS environment
    // DB_HOST/DB_PORT/DB_USER needed by entrypoint.sh wait_for_database()
    const bopsCommonEnv: Record<string, string> = {
      RAILS_ENV: 'production',
      DATABASE_URL: databaseUrl,
      REDIS_URL: props.redisUrl,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
      DB_NAME: 'bops_production',
      SECRET_KEY_BASE: bopsSecretKeyBase,
      OTP_SECRET_ENCRYPTION_KEY: otpSecretKey,
      ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY: arePrimaryKey,
      ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY: areDeterministicKey,
      ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT: areKeySalt,
      DEFAULT_LOCAL_AUTHORITY: 'ndx-demo',
      NOTIFY_API_KEY: 'test-00000000-0000-0000-0000-000000000000-00000000-0000-0000-0000-000000000000',
      OS_VECTOR_TILES_API_KEY: props.osMapApiKeyParam.valueAsString,
      S3_BUCKET: props.uploadsBucket.bucketName,
      AWS_REGION: cdk.Aws.REGION,
      GROVER_NO_SANDBOX: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
      RAILS_SERVE_STATIC_FILES: 'true',
      RAILS_LOG_TO_STDOUT: 'true',
      BOPS_ENVIRONMENT: 'production',
      ADMIN_PASSWORD: adminPassword,
      API_BEARER: apiBearer,
      DOMAIN: this.loadBalancerDnsName,
      APPLICANTS_DOMAIN: `${this.loadBalancerDnsName}:8080`,
    };

    // ==========================================================================
    // BOPS Web Task Definition (1 vCPU, 2GB, port 3000)
    // ==========================================================================
    const bopsWebTaskDef = new ecs.FargateTaskDefinition(this, 'BopsWebTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    bopsWebTaskDef.addContainer('bops-web', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'bops-web',
      }),
      environment: bopsCommonEnv,
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/healthcheck || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
      // Note: sharedMemorySize not supported on Fargate. Chrome PDF generation
      // uses /tmp instead of /dev/shm. If PDF fails, increase task memory.
    });

    // ==========================================================================
    // BOPS Worker Task Definition (0.5 vCPU, 1GB, Sidekiq)
    // ==========================================================================
    const bopsWorkerTaskDef = new ecs.FargateTaskDefinition(this, 'BopsWorkerTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    bopsWorkerTaskDef.addContainer('bops-worker', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'bops-worker',
      }),
      environment: bopsCommonEnv,
      command: ['bundle', 'exec', 'sidekiq'],
    });

    // ==========================================================================
    // BOPS-Applicants Task Definition (0.5 vCPU, 1GB, port 80)
    // ==========================================================================
    const bopsApplicantsTaskDef = new ecs.FargateTaskDefinition(this, 'BopsApplicantsTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    bopsApplicantsTaskDef.addContainer('bops-applicants', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops-applicants:latest'),
      // Upstream Dockerfile has no CMD — must provide one
      command: ['bundle', 'exec', 'rails', 'server', '-b', '0.0.0.0', '-p', '80'],
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'bops-applicants',
      }),
      environment: {
        RAILS_ENV: 'production',
        DATABASE_URL: applicantsDatabaseUrl,
        SECRET_KEY_BASE: bopsSecretKeyBase,
        API_HOST: this.loadBalancerDnsName,
        PROTOCOL: 'http',
        API_BEARER: apiBearer,
        OS_VECTOR_TILES_API_KEY: props.osMapApiKeyParam.valueAsString,
        RAILS_SERVE_STATIC_FILES: 'true',
        RAILS_LOG_TO_STDOUT: 'true',
        DEFAULT_LOCAL_AUTHORITY: 'ndx-demo',
      },
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/healthcheck || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    // ==========================================================================
    // ALB Listeners and Target Groups
    // ==========================================================================
    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    const applicantsListener = this.loadBalancer.addListener('HTTP8080', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // ==========================================================================
    // ECS Services
    // ==========================================================================
    const bopsWebService = new ecs.FargateService(this, 'BopsWebService', {
      cluster: this.cluster,
      taskDefinition: bopsWebTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxBops-Web',
      healthCheckGracePeriod: cdk.Duration.minutes(10),
    });

    const bopsWorkerService = new ecs.FargateService(this, 'BopsWorkerService', {
      cluster: this.cluster,
      taskDefinition: bopsWorkerTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      serviceName: 'NdxBops-Worker',
    });

    const bopsApplicantsService = new ecs.FargateService(this, 'BopsApplicantsService', {
      cluster: this.cluster,
      taskDefinition: bopsApplicantsTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxBops-Applicants',
      healthCheckGracePeriod: cdk.Duration.minutes(10),
    });

    // Register BOPS Web with port 80 listener
    httpListener.addTargets('BopsWebTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [bopsWebService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/healthcheck',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });

    // Register BOPS-Applicants with port 8080 listener
    applicantsListener.addTargets('BopsApplicantsTarget', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [bopsApplicantsService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/healthcheck',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });

    // ==========================================================================
    // Seed Task — ECS one-shot task as CloudFormation custom resource
    // ==========================================================================
    const seedTaskDef = new ecs.FargateTaskDefinition(this, 'SeedTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    seedTaskDef.addContainer('seed', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'bops-seed',
      }),
      environment: bopsCommonEnv,
      command: ['bash', '/rails/scripts/seed-entrypoint.sh'],
      essential: true,
    });

    // Single Lambda that runs ECS task and polls synchronously (up to 15 min Lambda timeout).
    // Cannot use cr.Provider — it creates S3-backed state machine Lambdas requiring CDK bootstrap,
    // which ISB sandbox accounts do not have.
    const seedRole = new iam.Role(this, 'SeedLambdaRole', {
      roleName: 'InnovationSandbox-ndx-bops-seed-lambda',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    seedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecs:RunTask', 'ecs:DescribeTasks'],
        resources: ['*'],
      }),
    );

    seedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [executionRole.roleArn, taskRole.roleArn],
      }),
    );

    const seedFn = new lambda.Function(this, 'SeedFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: seedRole,
      timeout: cdk.Duration.minutes(14),
      code: lambda.Code.fromInline(SEED_LAMBDA_CODE),
    });

    const seedCR = new cdk.CfnCustomResource(this, 'SeedCustomResource', {
      serviceToken: seedFn.functionArn,
    });
    seedCR.addPropertyOverride('ClusterName', this.cluster.clusterName);
    seedCR.addPropertyOverride('TaskDefinitionArn', seedTaskDef.taskDefinitionArn);
    seedCR.addPropertyOverride('Subnets', props.vpc.publicSubnets.map(s => s.subnetId));
    seedCR.addPropertyOverride('SecurityGroups', [props.fargateSecurityGroup.securityGroupId]);
    seedCR.addPropertyOverride('Timestamp', Date.now().toString());
    seedCR.node.addDependency(seedRole);
    // Seed needs Aurora (creates DBs) but NOT the ECS services
    // Applicants service needs the seed (creates bops_applicants_production DB)
    bopsApplicantsService.node.addDependency(seedCR);
  }
}

// Single Lambda: runs ECS task then polls every 30s until STOPPED.
// Uses CfnCustomResource (not cr.Provider) to avoid CDK bootstrap dependency.
// Lambda timeout is 14 minutes — seed task typically completes in 5-10 minutes.
const SEED_LAMBDA_CODE = `const{ECSClient,RunTaskCommand,DescribeTasksCommand}=require("@aws-sdk/client-ecs");const https=require("https");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
try{if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return;}
const p=e.ResourceProperties;const ecs=new ECSClient();
console.log("Starting seed task...");
const r=await ecs.send(new RunTaskCommand({cluster:p.ClusterName,taskDefinition:p.TaskDefinitionArn,launchType:"FARGATE",networkConfiguration:{awsvpcConfiguration:{subnets:p.Subnets,securityGroups:p.SecurityGroups,assignPublicIp:"ENABLED"}}}));
if(!r.tasks||r.tasks.length===0){const reason=r.failures?r.failures.map(f=>f.reason).join(", "):"unknown";throw new Error("RunTask failed: "+reason);}
const taskArn=r.tasks[0].taskArn;const cluster=taskArn.split("/")[1];
console.log("Task started:",taskArn);
for(let i=0;i<28;i++){await sleep(30000);
const d=await ecs.send(new DescribeTasksCommand({cluster,tasks:[taskArn]}));
const t=d.tasks&&d.tasks[0];if(!t){console.log("Task not found");break;}
console.log("Poll",i+1,"status:",t.lastStatus);
if(t.lastStatus==="STOPPED"){const exit=t.containers&&t.containers[0]?t.containers[0].exitCode:null;
if(exit!==0){throw new Error("Seed task failed with exit code "+exit);}
console.log("Seed complete");rp.PhysicalResourceId=taskArn;await send(e.ResponseURL,rp);return;}}
throw new Error("Seed task did not complete within timeout");}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;
