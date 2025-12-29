import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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

    // TODO: Story 1.4 - Networking construct (security groups)
    // const networking = new NetworkingConstruct(this, 'Networking', { ... });

    // TODO: Story 1.5 - Database construct (Aurora Serverless v2)
    // const database = new DatabaseConstruct(this, 'Database', { ... });

    // TODO: Story 1.6 - Storage construct (EFS)
    // const storage = new StorageConstruct(this, 'Storage', { ... });

    // TODO: Story 1.7 - Compute construct (Fargate, ALB)
    // const compute = new ComputeConstruct(this, 'Compute', { ... });

    // TODO: Story 1.12 - CloudFormation outputs
    // new cdk.CfnOutput(this, 'DrupalUrl', { ... });
  }
}
