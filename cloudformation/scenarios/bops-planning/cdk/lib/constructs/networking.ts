import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  readonly deploymentMode?: 'development' | 'production';
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly auroraSecurityGroup: ec2.SecurityGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkingConstructProps) {
    super(scope, id);

    const prefix = 'NdxBops';

    // VPC: public-only subnets, 2 AZs, 0 NAT gateways
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

    // ALB Security Group — inbound 80, 8080, 443 from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: 'ALB security group for BOPS Planning',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      'Allow HTTP:8080 from internet (BOPS-Applicants)',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet',
    );

    // Fargate Security Group — inbound from ALB on 3000 and 80, outbound all
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: 'Fargate task security group for BOPS Planning',
      allowAllOutbound: true,
    });

    // BOPS web on port 3000
    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow HTTP:3000 from ALB (BOPS web)',
    );

    // BOPS-Applicants on port 80
    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 from ALB (BOPS-Applicants)',
    );

    // ALB outbound to Fargate
    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow HTTP:3000 to BOPS Fargate tasks',
    );

    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 to BOPS-Applicants Fargate tasks',
    );

    // Aurora Security Group — PostgreSQL 5432 from Fargate only
    this.auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Aurora-SG`,
      description: 'Aurora PostgreSQL security group for BOPS Planning',
      allowAllOutbound: false,
    });

    this.auroraSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from Fargate tasks',
    );

    // Redis Security Group — 6379 from Fargate only
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Redis-SG`,
      description: 'ElastiCache Redis security group for BOPS Planning',
      allowAllOutbound: false,
    });

    this.redisSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from Fargate tasks',
    );
  }
}
