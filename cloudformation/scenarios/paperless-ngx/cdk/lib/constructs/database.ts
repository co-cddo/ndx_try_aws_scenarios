import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

/**
 * Provisioned RDS Postgres on db.t4g.micro (Graviton). Provisions in ~3-4
 * minutes vs Aurora Serverless v2's 6-8, at a similar floor cost (~$0.016/hr
 * for the t4g.micro instance + 20 GB gp3). Trade-off: no scale-to-zero, but
 * Paperless's working set in a 90-min demo session is well within t4g.micro.
 */
export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    this.instance = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('paperless', {
        excludeCharacters: ' "\'\\/@#%:<>?[]^`{|}$&()+,;=~',
      }),
      databaseName: 'paperless',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      multiAz: false,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.secret = this.instance.secret!;
  }
}
