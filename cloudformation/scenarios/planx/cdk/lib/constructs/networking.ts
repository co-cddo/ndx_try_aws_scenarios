import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly fargateSecurityGroup: ec2.SecurityGroup;
  public readonly auroraSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const prefix = 'NdxPlanx';

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

    // ALB Security Group — inbound 80, 443 from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-ALB-SG`,
      description: 'ALB security group for PlanX',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet',
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet',
    );

    // Fargate Security Group — inbound from ALB, outbound all
    this.fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Fargate-SG`,
      description: 'Fargate task security group for PlanX',
      allowAllOutbound: true,
    });

    // All services run on different ports behind ALB
    for (const port of [80, 7002, 8000, 8080]) {
      this.fargateSecurityGroup.addIngressRule(
        this.albSecurityGroup,
        ec2.Port.tcp(port),
        `Allow port ${port} from ALB`,
      );
    }

    // ALB outbound to Fargate on all service ports
    for (const port of [80, 7002, 8000, 8080]) {
      this.albSecurityGroup.addEgressRule(
        this.fargateSecurityGroup,
        ec2.Port.tcp(port),
        `Allow port ${port} to Fargate`,
      );
    }

    // Aurora Security Group — PostgreSQL 5432 from Fargate only
    this.auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${prefix}-Aurora-SG`,
      description: 'Aurora PostgreSQL security group for PlanX',
      allowAllOutbound: false,
    });

    this.auroraSecurityGroup.addIngressRule(
      this.fargateSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from Fargate tasks',
    );
  }
}
