import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly ec2SecurityGroup: ec2.ISecurityGroup;
  readonly databaseInstance: rds.DatabaseInstance;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly referenceSaltSecret: secretsmanager.ISecret;
  readonly adminPasswordSecret: secretsmanager.ISecret;
  readonly govukPayApiKeyParam: cdk.CfnParameter;
}

export class ComputeConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly loadBalancerDnsName: string;

  private readonly _userData: ec2.UserData;
  private readonly _instance: ec2.Instance;
  private readonly _dbHost: string;
  private readonly _dbPassword: string;
  private readonly _referenceSalt: string;
  private readonly _adminPassword: string;
  private readonly _govukPayApiKey: string;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // CloudWatch log group
    new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-ims/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role — ISB SCP requires InnovationSandbox-ndx-* prefix
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: 'InnovationSandbox-ndx-ims-ec2',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });
    props.databaseSecret.grantRead(ec2Role);
    props.referenceSaltSecret.grantRead(ec2Role);
    props.adminPasswordSecret.grantRead(ec2Role);

    // cfn-init needs CloudFormation API access to read metadata and signal
    ec2Role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:DescribeStackResource',
        'cloudformation:SignalResource',
      ],
      resources: ['*'],
    }));

    // Store CDK tokens for configureUrls()
    // NOTE: Pass secret ARNs (not values) — secrets are read at runtime via AWS PowerShell.
    // unsafeUnwrap() produces {{resolve:secretsmanager:...}} dynamic refs that don't resolve in UserData.
    this._dbHost = props.databaseInstance.dbInstanceEndpointAddress;
    this._dbPassword = props.databaseSecret.secretArn;
    this._referenceSalt = props.referenceSaltSecret.secretArn;
    this._adminPassword = props.adminPasswordSecret.secretArn;
    this._govukPayApiKey = props.govukPayApiKeyParam.valueAsString;

    // UserData — commands added in configureUrls() after CDN is created
    this._userData = ec2.UserData.forWindows();

    // Windows Server 2022 Full (includes .NET Framework 4.8)
    this._instance = new ec2.Instance(this, 'Server', {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5A, ec2.InstanceSize.XLARGE),
      machineImage: ec2.MachineImage.latestWindows(
        ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE,
      ),
      securityGroup: props.ec2SecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role: ec2Role,
      userData: this._userData,
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(50, { volumeType: ec2.EbsDeviceVolumeType.GP3 }),
      }],
    });
    cdk.Tags.of(this._instance).add('Name', 'NdxIms-Server');

    // CreationPolicy — CloudFormation waits for cfn-signal before proceeding
    const cfnInstance = this._instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.cfnOptions.creationPolicy = {
      resourceSignal: { count: 1, timeout: 'PT45M' },
    };

    // ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxIms-ALB',
    });
    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    // 3 listeners → EC2 on ports 80 (Portal), 81 (Admin), 82 (Api)
    const sites = [
      { name: 'Portal', port: 80 },
      { name: 'Admin', port: 8081 },
      { name: 'Api', port: 8082 },
    ];

    for (const site of sites) {
      const listener = this.loadBalancer.addListener(`${site.name}HTTP`, {
        port: site.port,
        protocol: elbv2.ApplicationProtocol.HTTP,
      });

      listener.addTargets(`${site.name}Target`, {
        port: site.port,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [new elbv2_targets.InstanceIdTarget(this._instance.instanceId, site.port)],
        deregistrationDelay: cdk.Duration.seconds(30),
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 10,
          healthyHttpCodes: '200',
        },
      });
    }
  }

  /**
   * Injects CloudFront URLs and builds the complete UserData.
   * Uses cfn-init to provision setup.ps1 and seed-data.sql from template metadata.
   * Must be called AFTER the CloudFront construct is created.
   */
  public configureUrls(portalUrl: string, adminUrl: string, govukpayUrl: string): void {
    const cfnInstance = this._instance.node.defaultChild as ec2.CfnInstance;

    // Read files at synth time — embedded in CloudFormation Init metadata
    const setupScript = fs.readFileSync(
      path.join(__dirname, '../../../scripts/setup.ps1'), 'utf-8',
    );
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../../../scripts/seed-data.sql'), 'utf-8',
    );

    // Add CloudFormation::Init metadata — cfn-init provisions these files on the instance
    cfnInstance.addMetadata('AWS::CloudFormation::Init', {
      config: {
        files: {
          'C:\\setup\\setup.ps1': { content: setupScript },
          'C:\\setup\\seed-data.sql': { content: seedSql },
        },
      },
    });

    // UserData: call cfn-init, set variables, run setup, signal
    this._userData.addCommands(
      'New-Item -ItemType Directory -Force -Path C:\\setup | Out-Null',
      '',
      '# Provision files via cfn-init (reads CloudFormation::Init metadata)',
      `& "C:\\Program Files\\Amazon\\cfn-bootstrap\\cfn-init.exe" -v --stack ${cdk.Aws.STACK_NAME} --resource ${cfnInstance.logicalId} --region ${cdk.Aws.REGION}`,
      '',
      '# Read secrets from Secrets Manager at runtime (dynamic refs dont resolve in UserData)',
      `$dbHost = '${this._dbHost}'`,
      `$dbUser = 'admin'`,
      `$dbPassword = ((Get-SECSecretValue -SecretId '${this._dbPassword}' -Region ${cdk.Aws.REGION}).SecretString | ConvertFrom-Json).password`,
      `$referenceSalt = ((Get-SECSecretValue -SecretId '${this._referenceSalt}' -Region ${cdk.Aws.REGION}).SecretString | ConvertFrom-Json).REFERENCE_SALT`,
      `$adminPassword = ((Get-SECSecretValue -SecretId '${this._adminPassword}' -Region ${cdk.Aws.REGION}).SecretString | ConvertFrom-Json).ADMIN_PASSWORD`,
      `$govukPayApiKey = '${this._govukPayApiKey}'`,
      `$portalUrl = '${portalUrl}'`,
      `$adminUrl = '${adminUrl}'`,
      `$govukpayUrl = '${govukpayUrl}'`,
      '',
      '# Run setup (ErrorActionPreference=Continue so native command stderr doesnt abort)',
      '$setupExitCode = 0',
      '$ErrorActionPreference = "Continue"',
      'try {',
      '    & C:\\setup\\setup.ps1',
      '    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "setup.ps1 exited with code $LASTEXITCODE" }',
      '} catch {',
      '    Write-Host "SETUP FAILED: $_"',
      '    $setupExitCode = 1',
      '}',
      '',
      '# Signal CloudFormation',
      `& "C:\\Program Files\\Amazon\\cfn-bootstrap\\cfn-signal.exe" -e $setupExitCode --stack ${cdk.Aws.STACK_NAME} --resource ${cfnInstance.logicalId} --region ${cdk.Aws.REGION}`,
    );
  }
}
