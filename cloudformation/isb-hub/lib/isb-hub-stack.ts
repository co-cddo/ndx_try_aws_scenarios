import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cfn from 'aws-cdk-lib/aws-cloudformation';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const HUB_ACCOUNT = '568672915267';
const ISB_NAMESPACE = 'ndx';
const BLUEPRINTS_BUCKET_NAME = `ndx-try-isb-blueprints-${HUB_ACCOUNT}`;
const BLUEPRINTS_BUCKET_REGION = 'us-east-1';
const GITHUB_REPO = 'co-cddo/ndx_try_aws_scenarios';
const DEPLOY_ROLE_NAME = 'isb-hub-github-actions-deploy';
const SCENARIOS = [
  { name: 'council-chatbot', description: 'NDX:Try Council Chatbot - AI-powered resident Q&A assistant' },
  { name: 'foi-redaction', description: 'NDX:Try FOI Redaction - Automated sensitive data redaction for FOI requests' },
  { name: 'planning-ai', description: 'NDX:Try Planning Application AI - Intelligent document analysis for planning decisions' },
  { name: 'quicksight-dashboard', description: 'NDX:Try QuickSight Dashboard - Service performance analytics and reporting' },
  { name: 'smart-car-park', description: 'NDX:Try Smart Car Park - Real-time parking availability with DynamoDB' },
  { name: 'text-to-speech', description: 'NDX:Try Text to Speech - Accessibility audio generation using Amazon Polly' },
  { name: 'localgov-drupal', description: 'NDX:Try LocalGov Drupal - AI-enhanced CMS for UK councils' },
  { name: 'simply-readable', description: 'NDX:Try Simply Readable - Document Translation & Easy Read, built by Swindon Borough Council' },
  { name: 'minute', description: 'Minute AI - Meeting transcription and AI-powered minute generation' },
  { name: 'all-demo', description: 'NDX:Try All Demo - Deploys all 7 scenarios as nested stacks' },
];

export class IsbHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // S3 BUCKET (imported — already exists in us-east-1)
    // ========================================================================
    const bucket = s3.Bucket.fromBucketName(this, 'BlueprintsBucket', BLUEPRINTS_BUCKET_NAME);

    // ========================================================================
    // NOTE: Bucket policy (AllowOrgAccountsReadTemplates) is managed
    // directly in us-east-1 — not via this stack (us-west-2).
    // ========================================================================

    // ========================================================================
    // TEMPLATE UPLOADS — one BucketDeployment per scenario
    // ========================================================================
    const deployments: Record<string, s3deploy.BucketDeployment> = {};

    for (const scenario of SCENARIOS) {
      const pascalName = scenario.name
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      const deployment = new s3deploy.BucketDeployment(this, `${pascalName}Templates`, {
        sources: [
          s3deploy.Source.asset(path.join(__dirname, '..', '..', 'scenarios', scenario.name), {
            exclude: ['*', '!template.yaml'],
          }),
        ],
        destinationBucket: bucket,
        destinationKeyPrefix: `scenarios/${scenario.name}`,
      });

      // Grant permissions on imported bucket (CDK can't auto-grant on imported resources)
      bucket.grantReadWrite(deployment.handlerRole);

      deployments[scenario.name] = deployment;
    }

    // ========================================================================
    // GITHUB OIDC PROVIDER (lookup existing — only one can exist per account)
    // ========================================================================
    // If the OIDC provider does NOT exist yet, comment out the fromOpenIdConnectProviderArn
    // line and uncomment the new OpenIdConnectProvider block below.
    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubOidc',
      `arn:aws:iam::${HUB_ACCOUNT}:oidc-provider/token.actions.githubusercontent.com`,
    );

    // Uncomment this block if no OIDC provider exists in the account:
    // const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
    //   url: 'https://token.actions.githubusercontent.com',
    //   clientIds: ['sts.amazonaws.com'],
    // });

    // ========================================================================
    // GITHUB ACTIONS IAM ROLE
    // ========================================================================
    const deployRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: DEPLOY_ROLE_NAME,
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': `repo:${GITHUB_REPO}:ref:refs/heads/main`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    // Allow CDK deploy (assume CDK bootstrap roles)
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${HUB_ACCOUNT}:role/cdk-*-${HUB_ACCOUNT}-us-west-2`,
        ],
      }),
    );

    // Allow S3 operations on blueprints bucket
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::${BLUEPRINTS_BUCKET_NAME}`,
          `arn:aws:s3:::${BLUEPRINTS_BUCKET_NAME}/*`,
        ],
      }),
    );

    // Allow StackSet management
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStackSet',
          'cloudformation:UpdateStackSet',
          'cloudformation:DeleteStackSet',
          'cloudformation:DescribeStackSet',
          'cloudformation:ListStackSets',
          'cloudformation:ListStackInstances',
        ],
        resources: [
          `arn:aws:cloudformation:*:${HUB_ACCOUNT}:stackset/ndx-try-*:*`,
        ],
      }),
    );

    // ========================================================================
    // STACKSETS — one per scenario, no stack instances (ISB manages those)
    // ========================================================================
    for (const scenario of SCENARIOS) {
      const pascalName = scenario.name
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      const templatePath = path.join(__dirname, '..', '..', 'scenarios', scenario.name, 'template.yaml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const contentHash = crypto.createHash('sha256').update(templateContent).digest('hex').substring(0, 16);

      const stackSet = new cfn.CfnStackSet(this, `${pascalName}StackSet`, {
        stackSetName: `ndx-try-${scenario.name}`,
        permissionModel: 'SELF_MANAGED',
        administrationRoleArn: `arn:aws:iam::${HUB_ACCOUNT}:role/InnovationSandbox-${ISB_NAMESPACE}-IntermediateRole`,
        executionRoleName: `InnovationSandbox-${ISB_NAMESPACE}-SandboxAccountRole`,
        capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        managedExecution: { Active: true },
        templateUrl: `https://${BLUEPRINTS_BUCKET_NAME}.s3.${BLUEPRINTS_BUCKET_REGION}.amazonaws.com/scenarios/${scenario.name}/template.yaml`,
        description: `${scenario.description} [${contentHash}]`,
      });

      // Ensure template is uploaded before StackSet references it
      stackSet.node.addDependency(deployments[scenario.name]);
    }

    // ========================================================================
    // OUTPUTS
    // ========================================================================
    new cdk.CfnOutput(this, 'DeployRoleArn', {
      value: deployRole.roleArn,
      description: 'GitHub Actions deploy role ARN',
    });

    new cdk.CfnOutput(this, 'BlueprintsBucketName', {
      value: BLUEPRINTS_BUCKET_NAME,
      description: 'S3 bucket for ISB blueprint templates',
    });
  }
}
