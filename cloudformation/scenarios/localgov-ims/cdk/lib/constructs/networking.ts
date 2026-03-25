import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const prefix = 'NdxIms';

    // VPC: public-only subnets, 2 AZs, 0 NAT gateways
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-VPC`,
      maxAzs: 3,
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

    // ALB Security Group — inbound 80, 81, 82 from internet
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
      ec2.Port.tcp(8081),
      'Allow HTTP:8081 from internet (Admin)',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8082),
      'Allow HTTP:8082 from internet (Api)',
    );

    // EC2 Security Group — inbound from ALB on 80, 81, 82, outbound all
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-EC2-SG`,
      description: 'EC2 instance security group for LocalGov IMS',
      allowAllOutbound: true, // Internet for downloads, GOV.UK Pay API
    });

    this.ec2SecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 from ALB (Portal)',
    );

    this.ec2SecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8081),
      'Allow HTTP:8081 from ALB (Admin)',
    );

    this.ec2SecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8082),
      'Allow HTTP:8082 from ALB (Api)',
    );

    // ALB outbound to EC2
    this.albSecurityGroup.addEgressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP:80 to EC2 (Portal)',
    );

    this.albSecurityGroup.addEgressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(8081),
      'Allow HTTP:8081 to EC2 (Admin)',
    );

    this.albSecurityGroup.addEgressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(8082),
      'Allow HTTP:8082 to EC2 (Api)',
    );

    // RDS Security Group — SQL Server 1433 from EC2 only
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-RDS-SG`,
      description: 'RDS SQL Server security group for LocalGov IMS',
      allowAllOutbound: false,
    });

    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(1433),
      'Allow SQL Server from EC2',
    );
  }
}
