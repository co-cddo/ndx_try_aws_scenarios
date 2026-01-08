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

/**
 * Configuration properties for the Compute construct.
 */
export interface ComputeConstructProps {
  /**
   * The VPC to deploy the Fargate service into.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Security group for the Application Load Balancer.
   */
  readonly albSecurityGroup: ec2.ISecurityGroup;

  /**
   * Security group for the Fargate tasks.
   */
  readonly fargateSecurityGroup: ec2.ISecurityGroup;

  /**
   * The Aurora database cluster for Drupal.
   */
  readonly databaseCluster: rds.IDatabaseCluster;

  /**
   * The Secrets Manager secret containing database credentials.
   */
  readonly databaseSecret: secretsmanager.ISecret;

  /**
   * The EFS file system for Drupal file storage.
   */
  readonly fileSystem: efs.IFileSystem;

  /**
   * The EFS access point for Drupal files.
   */
  readonly accessPoint: efs.IAccessPoint;

  /**
   * Deployment mode affects compute configuration.
   * - development: Enables ECS Exec for debugging
   * - production: Optimized for demos
   * @default 'production'
   */
  readonly deploymentMode?: 'development' | 'production';

  /**
   * Optional WaitCondition URL for signaling CloudFormation
   * when Drupal initialization completes.
   */
  readonly waitConditionUrl?: string;

  /**
   * Admin password for Drupal.
   * If provided, sets ADMIN_PASSWORD environment variable.
   */
  readonly adminPassword?: string;
}

/**
 * Compute construct for LocalGov Drupal stack.
 *
 * Creates the Fargate service and Application Load Balancer with:
 * - 0.5 vCPU, 1GB memory Fargate task
 * - Container image from ghcr.io
 * - EFS volume mount for persistent file storage
 * - ALB with HTTP/HTTPS listeners
 * - IAM roles for AWS AI service access
 *
 * @see {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs.FargateService.html}
 */
export class ComputeConstruct extends Construct {
  /**
   * The ECS cluster hosting the Fargate service.
   */
  public readonly cluster: ecs.Cluster;

  /**
   * The Fargate service running Drupal.
   */
  public readonly service: ecs.FargateService;

  /**
   * The Application Load Balancer for external access.
   */
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  /**
   * The ALB DNS name for accessing Drupal.
   */
  public readonly loadBalancerDnsName: string;

  /**
   * The CloudWatch Log Group for container logs.
   */
  public readonly logGroup: logs.ILogGroup;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const deploymentMode = props.deploymentMode ?? 'production';

    // ==========================================================================
    // ECS Cluster
    // ==========================================================================
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: `NdxDrupal-${deploymentMode}`,
      containerInsights: deploymentMode === 'production',
    });

    // ==========================================================================
    // CloudWatch Log Group
    // ==========================================================================
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ndx-drupal/${deploymentMode}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================================================
    // Task Execution Role (for pulling images and logging)
    // Role name must match SCP pattern: InnovationSandbox-ndx*
    // ==========================================================================
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `InnovationSandbox-ndx-${deploymentMode}-exec`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Allow reading database secret
    props.databaseSecret.grantRead(executionRole);

    // ==========================================================================
    // Task Role (for AWS AI services)
    // Role name must match SCP pattern: InnovationSandbox-ndx*
    // ==========================================================================
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `InnovationSandbox-ndx-${deploymentMode}-task`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Bedrock permissions for AI content generation
    // Uses Amazon Nova models exclusively:
    // - Nova Pro/Lite for text generation (via Converse API)
    // - Nova Canvas for image generation (via InvokeModel API)
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:Converse',
          'bedrock:ConverseStream',
        ],
        resources: [
          'arn:aws:bedrock:*::foundation-model/amazon.nova-*',
        ],
      }),
    );

    // Polly permissions for text-to-speech
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['polly:SynthesizeSpeech', 'polly:DescribeVoices'],
        resources: ['*'],
      }),
    );

    // Translate permissions for content translation
    // Note: comprehend:DetectDominantLanguage is required when using
    // SourceLanguageCode='auto' with TranslateText API
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'translate:TranslateText',
          'translate:ListLanguages',
          'comprehend:DetectDominantLanguage',
        ],
        resources: ['*'],
      }),
    );

    // Rekognition permissions for image analysis
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rekognition:DetectLabels', 'rekognition:DetectText'],
        resources: ['*'],
      }),
    );

    // Textract permissions for document processing
    // Include both synchronous and asynchronous APIs
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'textract:AnalyzeDocument',
          'textract:DetectDocumentText',
          'textract:StartDocumentAnalysis',
          'textract:GetDocumentAnalysis',
          'textract:StartDocumentTextDetection',
          'textract:GetDocumentTextDetection',
        ],
        resources: ['*'],
      }),
    );

    // CloudWatch Logs permissions
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      }),
    );

    // Allow reading database secret from task role too
    props.databaseSecret.grantRead(taskRole);

    // EFS permissions for IAM-authenticated mounts
    props.fileSystem.grantRootAccess(taskRole);

    // ==========================================================================
    // Fargate Task Definition
    // ==========================================================================
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 512, // 0.5 vCPU
      memoryLimitMiB: 1024, // 1 GB
      executionRole,
      taskRole,
    });

    // Add EFS volume for Drupal files
    taskDefinition.addVolume({
      name: 'drupal-files',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        authorizationConfig: {
          accessPointId: props.accessPoint.accessPointId,
          iam: 'ENABLED',
        },
        transitEncryption: 'ENABLED',
      },
    });

    // Build environment variables
    const containerEnvironment: Record<string, string> = {
      DEPLOYMENT_MODE: deploymentMode,
      DB_HOST: props.databaseCluster.clusterEndpoint.hostname,
      DB_NAME: 'drupal',
      DB_PORT: props.databaseCluster.clusterEndpoint.port.toString(),
    };

    // Add WaitCondition URL if provided
    if (props.waitConditionUrl) {
      containerEnvironment.WAIT_CONDITION_URL = props.waitConditionUrl;
    }

    // Add admin password if provided
    if (props.adminPassword) {
      containerEnvironment.ADMIN_PASSWORD = props.adminPassword;
    }

    // Add container - pull from GitHub Container Registry
    const container = taskDefinition.addContainer('drupal', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov_drupal:latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'drupal',
      }),
      environment: {
        ...containerEnvironment,
        // Use CloudFormation dynamic references for credentials
        // This resolves at deploy time, avoiding ECS secret fetch at runtime
        // (workaround for sandbox SCP restrictions on secretsmanager:GetSecretValue)
        DB_USER: props.databaseSecret.secretValueFromJson('username').unsafeUnwrap(),
        DB_PASSWORD: props.databaseSecret.secretValueFromJson('password').unsafeUnwrap(),
      },
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        // Use /health endpoint which returns OK even during initialization
        command: ['CMD-SHELL', 'curl -f http://localhost/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        // Maximum allowed by ECS is 300 seconds (5 minutes)
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    // Mount EFS volume
    container.addMountPoints({
      sourceVolume: 'drupal-files',
      containerPath: '/var/www/drupal/sites/default/files',
      readOnly: false,
    });

    // ==========================================================================
    // Application Load Balancer
    // ==========================================================================
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `NdxDrupal-ALB-${deploymentMode}`,
    });

    // HTTP listener (redirects to HTTPS in production, serves directly in dev)
    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // ==========================================================================
    // Fargate Service
    // ==========================================================================
    this.service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      assignPublicIp: true, // Required for public subnet
      enableExecuteCommand: true, // Enable ECS Exec for all modes
      circuitBreaker: {
        rollback: true,
      },
      serviceName: `NdxDrupal-Service-${deploymentMode}`,
      // Allow 10 minutes for container initialization (Drupal install, AI content generation)
      // before ALB health checks can fail the deployment
      healthCheckGracePeriod: cdk.Duration.minutes(10),
    });

    // Register service with ALB
    httpListener.addTargets('DrupalTarget', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      // Allow 10 minutes for container initialization (Drupal install, AI content generation)
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

    // Expose ALB DNS name
    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;
  }
}
