import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * Configuration properties for the Networking construct.
 */
export interface NetworkingConstructProps {
  /**
   * Deployment mode affects security group naming and descriptions.
   * @default 'production'
   */
  readonly deploymentMode?: 'development' | 'production';
}

/**
 * Networking construct for LocalGov Drupal stack.
 *
 * Creates security groups for all components with least-privilege access:
 * - ALB: Accepts HTTPS from internet, forwards to Fargate
 * - Fargate: Accepts HTTP from ALB, connects to Aurora and EFS
 * - Aurora: Accepts MySQL only from Fargate
 * - EFS: Accepts NFS only from Fargate
 *
 * Uses the default VPC per ADR-002 (no NAT Gateway costs, faster deployment).
 *
 * @see {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SecurityGroup.html}
 */
export class NetworkingConstruct extends Construct {
  /**
   * The default VPC used by the stack.
   */
  public readonly vpc: ec2.IVpc;

  /**
   * Security group for the Application Load Balancer.
   * Allows inbound HTTPS (443) from anywhere.
   */
  public readonly albSecurityGroup: ec2.SecurityGroup;

  /**
   * Security group for Fargate tasks.
   * Allows inbound HTTP (80) from ALB only.
   */
  public readonly fargateSecurityGroup: ec2.SecurityGroup;

  /**
   * Security group for Aurora Serverless v2 cluster.
   * Allows inbound MySQL (3306) from Fargate only.
   */
  public readonly auroraSecurityGroup: ec2.SecurityGroup;

  /**
   * Security group for EFS mount targets.
   * Allows inbound NFS (2049) from Fargate only.
   */
  public readonly efsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkingConstructProps) {
    super(scope, id);

    const deploymentMode = props?.deploymentMode ?? 'production';
    const prefix = 'NdxDrupal';

    // ==========================================================================
    // VPC Creation
    // ==========================================================================
    // Create a new VPC with public subnets only (no NAT Gateway costs)
    // This works for Fargate tasks with public IPs that need to access AWS APIs
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-VPC`,
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway to reduce costs
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // ==========================================================================
    // ALB Security Group
    // ==========================================================================
    // Accepts HTTPS traffic from the internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: `ALB security group for LocalGov Drupal (${deploymentMode})`,
      allowAllOutbound: false, // Restrict outbound to Fargate only
    });

    // Allow HTTPS from anywhere (internet-facing ALB)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet',
    );

    // Also allow HTTP for redirect to HTTPS (optional, can be removed if ALB only listens on 443)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet (redirect to HTTPS)',
    );

    // ==========================================================================
    // Fargate Security Group
    // ==========================================================================
    // Accepts HTTP from ALB, connects to Aurora, EFS, and AWS APIs
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: `Fargate task security group for LocalGov Drupal (${deploymentMode})`,
      allowAllOutbound: true, // Needs access to AWS APIs (Bedrock, Polly, etc.)
    });

    // Allow HTTP from ALB only
    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB',
    );

    // ALB outbound to Fargate
    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP to Fargate tasks',
    );

    // ==========================================================================
    // Aurora Security Group
    // ==========================================================================
    // Accepts MySQL only from Fargate
    this.auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Aurora-SG`,
      description: `Aurora MySQL security group for LocalGov Drupal (${deploymentMode})`,
      allowAllOutbound: false, // No outbound needed
    });

    // Allow MySQL from Fargate only
    this.auroraSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from Fargate tasks',
    );

    // ==========================================================================
    // EFS Security Group
    // ==========================================================================
    // Accepts NFS only from Fargate
    this.efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-EFS-SG`,
      description: `EFS security group for LocalGov Drupal (${deploymentMode})`,
      allowAllOutbound: false, // No outbound needed
    });

    // Allow NFS from Fargate only
    this.efsSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS from Fargate tasks',
    );
  }
}
