import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appregistry from 'aws-cdk-lib/aws-servicecatalogappregistry';
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

    // Admin credentials via Secrets Manager — resolved at CloudFormation deploy time
    // No secretName so CloudFormation generates a unique physical name, avoiding
    // collision on rollback (Secrets Manager 7-30 day recovery window)
    const adminSecret = new secretsmanager.Secret(this, 'AdminSecret', {
      description: 'Admin credentials for LocalGov Drupal',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Tag all resources
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'localgov-drupal');
    cdk.Tags.of(this).add('DeploymentMode', deploymentMode);
    cdk.Tags.of(this).add('CouncilTheme', councilTheme);

    // AppRegistry Application - visible in myApplications on the AWS Console
    const appRegistryApp = new appregistry.CfnApplication(this, 'AppRegistryApplication', {
      name: `NDXTry_LocalGov_Drupal_${this.account}`,
      description: 'NDX:Try - AI-Enhanced LocalGov Drupal CMS for UK councils',
      tags: { Project: 'ndx-try', Scenario: 'localgov-drupal' },
    });

    new appregistry.CfnResourceAssociation(this, 'AppRegistryAssociation', {
      application: appRegistryApp.attrId,
      resource: this.stackId,
      resourceType: 'CFN_STACK',
    });

    cdk.Tags.of(this).add('awsApplication', appRegistryApp.attrArn, {
      excludeResourceTypes: ['AWS::ServiceCatalogAppRegistry::Application', 'AWS::ServiceCatalogAppRegistry::ResourceAssociation'],
    });

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
      adminSecret,
    });

    // CloudFront distribution for HTTPS termination
    const cdn = new CloudFrontConstruct(this, 'CDN', {
      loadBalancer: compute.loadBalancer,
    });

    // ==========================================================================
    // Story 1.12 - CloudFormation Outputs
    // ==========================================================================

    // Drupal URL - primary access point (HTTPS via CloudFront)
    // Points to init-status page which redirects to home when initialization is complete
    new cdk.CfnOutput(this, 'DrupalUrl', {
      description: 'URL to access LocalGov Drupal (HTTPS)',
      value: `https://${cdn.domainName}/init-status`,
      exportName: `${this.stackName}-DrupalUrl`,
    });

    // Admin credentials for first-time login
    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'Drupal admin username',
      value: 'admin',
    });

    // Custom Resource to resolve admin password for display in Outputs
    const readSecretRole = new iam.Role(this, 'ReadSecretRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    readSecretRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [adminSecret.secretArn],
    }));

    const readSecretFn = new cdk.aws_lambda.Function(this, 'ReadSecretFn', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      role: readSecretRole,
      timeout: cdk.Duration.seconds(30),
      code: cdk.aws_lambda.Code.fromInline(`
const{SecretsManagerClient,GetSecretValueCommand}=require("@aws-sdk/client-secrets-manager");
const r=require("https");
exports.handler=async(e)=>{
  const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
  if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}
  try{
    const sm=new SecretsManagerClient();
    const sv=await sm.send(new GetSecretValueCommand({SecretId:e.ResourceProperties.SecretArn}));
    rp.Data={Password:sv.SecretString};
    await send(e.ResponseURL,rp);
  }catch(err){rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}
};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=r.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}
      `),
    });

    const readSecretCR = new cdk.CustomResource(this, 'ReadSecretCR', {
      serviceToken: readSecretFn.functionArn,
      properties: {
        SecretArn: adminSecret.secretArn,
      },
    });
    readSecretCR.node.addDependency(readSecretRole);

    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'Admin password for login',
      value: readSecretCR.getAttString('Password'),
    });

    // CloudWatch Logs URL for monitoring initialization
    const logGroupName = `/ndx-drupal/${deploymentMode}`;
    new cdk.CfnOutput(this, 'CloudWatchLogsUrl', {
      description: 'CloudWatch Logs for initialization monitoring',
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroupName)}`,
    });

    // Quick Create URL template (for documentation)
    new cdk.CfnOutput(this, 'StackDescription', {
      description: 'Stack description',
      value: 'AI-Enhanced LocalGov Drupal - Try AWS Scenarios',
    });
  }
}

