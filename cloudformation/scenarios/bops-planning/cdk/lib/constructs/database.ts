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

    // Aurora PostgreSQL 16 with PostGIS support
    // Do NOT hardcode secretName — avoids Secrets Manager recovery window collisions on redeploy
    this.cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_6,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('bops', {
        // Password is embedded in postgres://user:pass@host/db DATABASE_URL
        // Exclude chars that break Ruby URI.parse in userinfo component (RFC 3986)
        excludeCharacters: ' "\'\\/@#%:<>?[]^`{|}',
      }),
      defaultDatabaseName: 'bops_production',
      storageEncrypted: true,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: [],
      // Cluster parameter group for PostGIS extensions
      parameterGroup: new rds.ParameterGroup(this, 'BopsParams', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_16_6,
        }),
        parameters: {
          'rds.allowed_extensions': 'plpgsql,postgis,postgis_topology,btree_gin,pg_stat_statements',
          'shared_preload_libraries': 'pg_stat_statements',
        },
      }),
      backup: {
        retention: cdk.Duration.days(1),
      },
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.secret = this.cluster.secret!;
    this.clusterEndpoint = this.cluster.clusterEndpoint;
  }
}
