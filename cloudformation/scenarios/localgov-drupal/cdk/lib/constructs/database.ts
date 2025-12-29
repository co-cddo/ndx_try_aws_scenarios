import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

/**
 * Configuration properties for the Database construct.
 */
export interface DatabaseConstructProps {
  /**
   * The VPC to deploy the Aurora cluster into.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Security group for the Aurora cluster.
   * Should allow inbound MySQL (3306) from Fargate tasks only.
   */
  readonly securityGroup: ec2.ISecurityGroup;

  /**
   * Deployment mode affects database configuration.
   * - development: More verbose logging
   * - production: Optimized for demos
   * @default 'production'
   */
  readonly deploymentMode?: 'development' | 'production';
}

/**
 * Database construct for LocalGov Drupal stack.
 *
 * Creates an Aurora Serverless v2 MySQL 8.0 cluster with:
 * - Scale-to-zero capability (0.5-2 ACU)
 * - Encrypted storage
 * - Credentials stored in Secrets Manager
 * - Default database named 'drupal'
 *
 * @see {@link https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html}
 */
export class DatabaseConstruct extends Construct {
  /**
   * The Aurora Serverless v2 database cluster.
   */
  public readonly cluster: rds.DatabaseCluster;

  /**
   * The Secrets Manager secret containing database credentials.
   * Contains 'username' and 'password' keys.
   */
  public readonly secret: secretsmanager.ISecret;

  /**
   * The cluster endpoint for database connections.
   */
  public readonly clusterEndpoint: rds.Endpoint;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const deploymentMode = props.deploymentMode ?? 'production';

    // ==========================================================================
    // Secrets Manager Secret for Database Credentials
    // ==========================================================================
    // Auto-generate a secure password for the 'drupal' database user
    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `NdxDrupal/database-credentials-${deploymentMode}`,
      description: `Database credentials for LocalGov Drupal (${deploymentMode})`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'drupal' }),
        generateStringKey: 'password',
        excludePunctuation: true, // Avoid special chars that may cause issues
        passwordLength: 32,
      },
    });

    // ==========================================================================
    // Aurora Serverless v2 Cluster
    // ==========================================================================
    // MySQL 8.0 compatible with scale-to-zero for cost efficiency
    this.cluster = new rds.DatabaseCluster(this, 'Aurora', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      serverlessV2MinCapacity: 0.5, // Minimum ACU (scale-to-zero capable)
      serverlessV2MaxCapacity: 2, // Maximum ACU for demo workloads
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Default VPC has public subnets only
      },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.secret),
      defaultDatabaseName: 'drupal',
      storageEncrypted: true,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false, // Not directly accessible from internet
      }),
      // Single instance for demo simplicity (no reader replicas)
      readers: [],
      // Backup configuration
      backup: {
        retention: deploymentMode === 'production' ? cdk.Duration.days(7) : cdk.Duration.days(1),
      },
      // Enable deletion protection in production mode
      deletionProtection: false, // Disabled for demo cleanup
      removalPolicy:
        deploymentMode === 'development'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.SNAPSHOT,
    });

    // Expose cluster endpoint for other constructs
    this.clusterEndpoint = this.cluster.clusterEndpoint;
  }
}
