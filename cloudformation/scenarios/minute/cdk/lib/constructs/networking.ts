import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly auroraSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, _props?: NetworkingConstructProps) {
    super(scope, id);

    const prefix = 'NdxMinute';

    // VPC with public subnets only (no NAT Gateway costs)
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-VPC`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: 'ALB security group for Minute AI',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet',
    );

    // Fargate Security Group
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: 'Fargate task security group for Minute AI',
      allowAllOutbound: true, // Needs AWS API access (Bedrock, Transcribe, SQS, S3)
    });

    // ALB -> Frontend (port 8081)
    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8081),
      'Allow HTTP from ALB to frontend',
    );

    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(8081),
      'Allow HTTP to frontend tasks',
    );

    // Frontend -> Backend (port 8080) via Cloud Map
    this.fargateSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow frontend to backend via Cloud Map',
    );

    // Aurora Security Group
    this.auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Aurora-SG`,
      description: 'Aurora PostgreSQL security group for Minute AI',
      allowAllOutbound: false,
    });

    this.auroraSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from Fargate tasks',
    );
  }
}
