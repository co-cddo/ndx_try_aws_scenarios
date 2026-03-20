import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly endpoint: string;
  public readonly port: string;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // RDS SQL Server Express — SQL Server does not have Aurora
    // Do NOT hardcode secretName — avoids Secrets Manager recovery window collisions on redeploy
    this.instance = new rds.DatabaseInstance(this, 'SqlServer', {
      engine: rds.DatabaseInstanceEngine.sqlServerEx({
        version: rds.SqlServerEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        excludeCharacters: '\' "\\/@#%:<>?[]^`{|}$&()+,;=~',
      }),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [props.securityGroup],
      publiclyAccessible: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      backupRetention: cdk.Duration.days(1),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.secret = this.instance.secret!;
    this.endpoint = this.instance.dbInstanceEndpointAddress;
    this.port = this.instance.dbInstanceEndpointPort;
  }
}
