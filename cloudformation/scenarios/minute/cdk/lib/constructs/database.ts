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
  public readonly cluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.ISecret;
  public readonly clusterEndpoint: rds.Endpoint;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Database credentials
    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      description: 'Database credentials for Minute AI',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'minuteadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Aurora PostgreSQL Serverless v2
    this.cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.secret),
      defaultDatabaseName: 'minute_db',
      storageEncrypted: true,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: [],
      backup: {
        retention: cdk.Duration.days(1),
      },
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.clusterEndpoint = this.cluster.clusterEndpoint;
  }
}
