import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const prefix = 'NdxIms';

    // VPC: public-only subnets, 2 AZs, 0 NAT gateways
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-VPC`,
      maxAzs: 2,
      natGateways: 0,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    this.publicSubnets = this.vpc.publicSubnets;

    // ALB Security Group — inbound 80, 8080, 8082 from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: 'ALB security group for LocalGov IMS',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet (Portal)',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      'Allow HTTP:8080 from internet (Admin)',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8082),
      'Allow HTTP:8082 from internet (GOV.UK Pay)',
    );

    // Fargate Security Group — inbound from ALB on 80, 81, 83, outbound all
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: 'Fargate task security group for LocalGov IMS',
      allowAllOutbound: true, // AWS API + GOV.UK Pay API access
    });

    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 from ALB (Portal)',
    );

    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(81),
      'Allow HTTP:81 from ALB (Admin)',
    );

    this.fargateSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(83),
      'Allow HTTP:83 from ALB (GOV.UK Pay)',
    );

    // ALB outbound to Fargate
    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 to Fargate tasks (Portal)',
    );

    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(81),
      'Allow HTTP:81 to Fargate tasks (Admin)',
    );

    this.albSecurityGroup.addEgressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(83),
      'Allow HTTP:83 to Fargate tasks (GOV.UK Pay)',
    );

    // RDS Security Group — SQL Server 1433 from Fargate only
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-RDS-SG`,
      description: 'RDS SQL Server security group for LocalGov IMS',
      allowAllOutbound: false,
    });

    this.rdsSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(1433),
      'Allow SQL Server from Fargate tasks',
    );
  }
}
