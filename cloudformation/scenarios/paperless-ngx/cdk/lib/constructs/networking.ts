import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly auroraSecurityGroup: ec2.SecurityGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly fileSystemSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const prefix = 'NdxPaperless';

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

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: 'ALB security group for Paperless-ngx',
      allowAllOutbound: false,
    });
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP from internet');
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from internet');

    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: 'Fargate task security group for Paperless-ngx',
      allowAllOutbound: true,
    });
    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8000),
      'Paperless web from ALB',
    );

    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(8000),
      'ALB to Paperless task',
    );

    this.auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Aurora-SG`,
      description: 'Aurora PostgreSQL security group',
      allowAllOutbound: false,
    });
    this.auroraSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL from Fargate',
    );

    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Redis-SG`,
      description: 'ElastiCache Redis security group',
      allowAllOutbound: false,
    });
    this.redisSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(6379),
      'Redis from Fargate',
    );

    this.fileSystemSecurityGroup = new ec2.SecurityGroup(this, 'FileSystemSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-FS-SG`,
      description: 'S3 Files file system security group (NFS over TLS)',
      allowAllOutbound: false,
    });
    this.fileSystemSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(2049),
      'NFS from Fargate',
    );
    this.fileSystemSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(20049),
      'NFS over TLS (stunnel) from Fargate',
    );
  }
}
