import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudFrontConstruct } from './constructs/cloudfront';
import { ComputeConstruct } from './constructs/compute';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { StorageConstruct } from './constructs/storage';

/**
 * Configuration properties for the LocalGov Drupal Stack
 */
export interface LocalGovDrupalStackProps extends cdk.StackProps {
  /**
   * Deployment mode affects error handling and debugging capabilities.
   * - development: Enables ECS Exec, verbose logging
   * - production: Stricter error handling, optimized for demos
   * @default 'production'
   */
  deploymentMode?: 'development' | 'production';

  /**
   * Council theme for content generation.
   * - random: Randomly select a theme
   * - urban/rural/coastal/historic: Specific theme
   * @default 'random'
   */
  councilTheme?: 'random' | 'urban' | 'rural' | 'coastal' | 'historic';
}

/**
 * Main stack for the AI-Enhanced LocalGov Drupal on AWS scenario.
 *
 * This stack provisions all required AWS resources for a fully functional
 * LocalGov Drupal CMS with integrated AI capabilities.
 *
 * Architecture:
 * - Aurora Serverless v2 (MySQL) for database
 * - EFS for persistent file storage
 * - Fargate for container hosting
 * - ALB for load balancing and HTTPS termination
 * - Integration with Bedrock, Polly, Translate, Rekognition, Textract
 *
 * @see {@link https://github.com/localgovdrupal/localgov LocalGov Drupal}
 */
export class LocalGovDrupalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LocalGovDrupalStackProps) {
    super(scope, id, props);

    // Configuration
    const deploymentMode = props?.deploymentMode ?? 'production';
    // councilTheme will be used in Story 5.2 - Council Identity Generator
    // Storing in SSM parameter for future use
    const councilTheme = props?.councilTheme ?? 'random';

    // Tag all resources
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'localgov-drupal');
    cdk.Tags.of(this).add('DeploymentMode', deploymentMode);
    cdk.Tags.of(this).add('CouncilTheme', councilTheme);

    // Story 1.4 - Networking construct (security groups)
    const networking = new NetworkingConstruct(this, 'Networking', {
      deploymentMode,
    });

    // Story 1.5 - Database construct (Aurora Serverless v2)
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: networking.auroraSecurityGroup,
      deploymentMode,
    });

    // Story 1.6 - Storage construct (EFS)
    const storage = new StorageConstruct(this, 'Storage', {
      vpc: networking.vpc,
      securityGroup: networking.efsSecurityGroup,
      deploymentMode,
    });

    // Story 1.7 - Compute construct (Fargate, ALB)
    // Note: WaitCondition removed - container image doesn't signal completion
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      albSecurityGroup: networking.albSecurityGroup,
      fargateSecurityGroup: networking.fargateSecurityGroup,
      databaseCluster: database.cluster,
      databaseSecret: database.secret,
      fileSystem: storage.fileSystem,
      accessPoint: storage.accessPoint,
      deploymentMode,
    });

    // CloudFront distribution for HTTPS termination
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // ==========================================================================
    // Story 1.12 - CloudFormation Outputs
    // ==========================================================================

    // Drupal URL - primary access point (HTTPS via CloudFront)
    new cdk.CfnOutput(this, 'DrupalUrl', {
      description: 'URL to access LocalGov Drupal (HTTPS)',
      value: `https://${cdn.domainName}`,
      exportName: `${this.stackName}-DrupalUrl`,
    });

    // HTTP URL (ALB direct) - for debugging only
    new cdk.CfnOutput(this, 'DrupalUrlHttp', {
      description: 'Direct ALB URL (HTTP, for debugging)',
      value: `http://${compute.loadBalancerDnsName}`,
    });

    // Admin credentials for first-time login
    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'Drupal admin username',
      value: 'admin',
    });

    // Admin password from Secrets Manager (dynamic reference)
    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'Drupal admin password (from Secrets Manager)',
      value: database.secret.secretValueFromJson('password').unsafeUnwrap(),
    });

    // CloudWatch Logs URL for monitoring initialization
    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for initialization monitoring',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent(compute.logGroup.logGroupName)}`,
    });

    // Quick Create URL template (for documentation)
    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'AI-Enhanced LocalGov Drupal - Try AWS Scenarios',
    });
  }
}

