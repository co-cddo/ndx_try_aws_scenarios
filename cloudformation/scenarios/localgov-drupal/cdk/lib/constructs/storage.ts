import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import { Construct } from 'constructs';

/**
 * Configuration properties for the Storage construct.
 */
export interface StorageConstructProps {
  /**
   * The VPC to deploy the EFS file system into.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Security group for the EFS mount targets.
   * Should allow inbound NFS (2049) from Fargate tasks only.
   */
  readonly securityGroup: ec2.ISecurityGroup;

  /**
   * Deployment mode affects storage configuration.
   * - development: RemovalPolicy.DESTROY for easy cleanup
   * - production: RemovalPolicy.RETAIN for data protection
   * @default 'production'
   */
  readonly deploymentMode?: 'development' | 'production';
}

/**
 * Storage construct for LocalGov Drupal stack.
 *
 * Creates an EFS file system for persistent Drupal file storage with:
 * - Encryption at rest and in transit
 * - Access point for /var/www/drupal/sites/default/files
 * - POSIX permissions for www-data user (UID/GID 33)
 * - Lifecycle policy to transition to IA after 30 days
 *
 * @see {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_efs.FileSystem.html}
 */
export class StorageConstruct extends Construct {
  /**
   * The EFS file system for Drupal files.
   */
  public readonly fileSystem: efs.FileSystem;

  /**
   * Access point for mounting Drupal files directory.
   * Pre-configured with www-data POSIX user.
   */
  public readonly accessPoint: efs.AccessPoint;

  /**
   * The EFS file system ID for CloudFormation outputs.
   */
  public readonly fileSystemId: string;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const deploymentMode = props.deploymentMode ?? 'production';

    // ==========================================================================
    // EFS File System
    // ==========================================================================
    // Encrypted storage for Drupal uploads and assets
    this.fileSystem = new efs.FileSystem(this, 'DrupalFiles', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Default VPC has public subnets only
      },
      securityGroup: props.securityGroup,
      encrypted: true,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      removalPolicy:
        deploymentMode === 'development'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
      fileSystemName: `NdxDrupal-Files-${deploymentMode}`,
    });

    // ==========================================================================
    // Access Point for Drupal Files
    // ==========================================================================
    // Configures the mount path and POSIX permissions for www-data
    this.accessPoint = this.fileSystem.addAccessPoint('DrupalFilesAP', {
      // Path within EFS where Drupal files are stored
      path: '/drupal-files',
      // POSIX user for container access (www-data = UID/GID 33)
      posixUser: {
        uid: '33',
        gid: '33',
      },
      // Create the directory with proper permissions if it doesn't exist
      createAcl: {
        ownerUid: '33',
        ownerGid: '33',
        permissions: '0755',
      },
    });

    // Expose file system ID for outputs
    this.fileSystemId = this.fileSystem.fileSystemId;
  }
}
