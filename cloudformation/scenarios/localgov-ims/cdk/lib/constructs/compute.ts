import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
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
  readonly databaseInstance: rds.DatabaseInstance;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly referenceSaltSecret: secretsmanager.ISecret;
  readonly adminPasswordSecret: secretsmanager.ISecret;
  readonly govukPayApiKeyParam: cdk.CfnParameter;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly container: ecs.ContainerDefinition;
  public readonly loadBalancerDnsName: string;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxIms-Cluster',
    });

    // CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-ims/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Roles — ISB SCP requires InnovationSandbox-ndx-* prefix
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-ims-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
    props.databaseSecret.grantRead(executionRole);

    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-ims-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [logGroup.logGroupArn],
      }),
    );

    // Task Definition — Windows Server 2022 Core on Fargate
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 2048,
      memoryLimitMiB: 4096,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.WINDOWS_SERVER_2022_CORE,
      },
    });

    // Resolve database connection details
    const dbHost = props.databaseInstance.dbInstanceEndpointAddress;
    const dbPassword = props.databaseSecret.secretValueFromJson('password').unsafeUnwrap();
    const referenceSalt = props.referenceSaltSecret.secretValueFromJson('REFERENCE_SALT').unsafeUnwrap();
    const adminPassword = props.adminPasswordSecret.secretValueFromJson('ADMIN_PASSWORD').unsafeUnwrap();

    // Container
    this.container = taskDef.addContainer('ims', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov-ims:latest'),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'ims' }),
      environment: {
        DB_HOST: dbHost,
        DB_USER: 'admin',
        DB_PASSWORD: dbPassword,
        REFERENCE_SALT: referenceSalt,
        GOVUKPAY_API_KEY: props.govukPayApiKeyParam.valueAsString,
        ADMIN_PASSWORD: adminPassword,
      },
      portMappings: [
        { containerPort: 80, protocol: ecs.Protocol.TCP },
        { containerPort: 81, protocol: ecs.Protocol.TCP },
        { containerPort: 82, protocol: ecs.Protocol.TCP },
        { containerPort: 83, protocol: ecs.Protocol.TCP },
      ],
      healthCheck: {
        command: ['CMD', 'powershell', '-Command', '(Invoke-WebRequest -Uri http://localhost:80/health -UseBasicParsing).StatusCode -eq 200'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
      stopTimeout: cdk.Duration.seconds(120),
    });

    // ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxIms-ALB',
    });
    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    // Fargate Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxIms-Service',
      healthCheckGracePeriod: cdk.Duration.minutes(15),
    });

    // Listener port 80 → Target Group (container port 80) — Portal
    const portalListener = this.loadBalancer.addListener('PortalHTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    portalListener.addTargets('PortalTarget', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });

    // Listener port 8080 → Target Group (container port 81) — Admin
    const adminListener = this.loadBalancer.addListener('AdminHTTP', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    adminListener.addTargets('AdminTarget', {
      port: 81,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });

    // Listener port 8082 → Target Group (container port 83) — GOV.UK Pay
    const govukPayListener = this.loadBalancer.addListener('GovUkPayHTTP', {
      port: 8082,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    govukPayListener.addTargets('GovUkPayTarget', {
      port: 83,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 10, // Higher threshold — Kestrel starts late
        healthyHttpCodes: '200',
      },
    });
  }
}
