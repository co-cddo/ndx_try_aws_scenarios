import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly councilConfig: string;
  readonly imageUri: string;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly logGroup: logs.ILogGroup;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxDpr-Cluster',
    });

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-dpr/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // IAM Roles — ISB SCP requires InnovationSandbox-ndx-* prefix
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-dpr-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-dpr-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      }),
    );

    // ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxDpr-ALB',
    });

    // Task Definition — Next.js is lightweight: 0.5 vCPU, 1 GB
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    taskDef.addContainer('dpr-web', {
      image: ecs.ContainerImage.fromRegistry(props.imageUri),
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'dpr-web' }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        COUNCIL_CONFIG: props.councilConfig,
        // Enable test councils mode so the register shows mock council data
        // without requiring real BOPS API keys
        TEST_COUNCILS: 'true',
      },
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      // No container health check — rely on ALB target group health check instead.
      // The minimal Next.js Alpine image doesn't include wget/curl, and node-based
      // health checks have quoting issues in CloudFormation templates.
    });

    // ALB Listener
    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxDpr-Web',
      healthCheckGracePeriod: cdk.Duration.minutes(5),
    });

    httpListener.addTargets('DprWebTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200,301,302',
      },
    });
  }
}
