import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cfn from 'aws-cdk-lib/aws-cloudformation';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
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
const CI_LEASE_ROLE_NAME = 'isb-hub-github-actions-ci-lease';
const ISB_JWT_SECRET_NAME = '/InnovationSandbox/ndx/Auth/JwtSecret';
const ISB_JWT_SECRET_REGION = 'us-west-2';
interface ScenarioConfig {
  name: string;
  description: string;
  parameterKeys?: string[];
  // sam-package output (scenarios/<name>/dist/template.yaml) rather than scenarios/<name>/template.yaml
  samStyle?: boolean;
}

const SCENARIOS: ScenarioConfig[] = [
  { name: 'council-chatbot', description: 'NDX:Try Council Chatbot - AI-powered resident Q&A assistant' },
  { name: 'foi-redaction', description: 'NDX:Try FOI Redaction - Automated sensitive data redaction for FOI requests' },
  { name: 'planning-ai', description: 'NDX:Try Planning Application AI - Intelligent document analysis for planning decisions' },
  { name: 'quicksight-dashboard', description: 'NDX:Try QuickSight Dashboard - Service performance analytics and reporting' },
  { name: 'smart-car-park', description: 'NDX:Try Smart Car Park - Real-time parking availability with DynamoDB' },
  { name: 'text-to-speech', description: 'NDX:Try Text to Speech - Accessibility audio generation using Amazon Polly' },
  { name: 'localgov-drupal', description: 'NDX:Try LocalGov Drupal - AI-enhanced CMS for UK councils' },
  { name: 'simply-readable', description: 'NDX:Try Simply Readable - Document Translation & Easy Read, built by Swindon Borough Council' },
  { name: 'localgov-ims', description: 'NDX:Try LocalGov IMS - Income Management System with GOV.UK Pay', parameterKeys: ['GovUkPayApiKey'] },
  { name: 'ai-contact-centre', description: 'NDX:Try AI Contact Centre - Amazon Connect with Lex, Bedrock RAG, multimodal photo describe, multi-intent triage, and multilingual support', samStyle: true },
  { name: 'minute', description: 'Minute AI - Meeting transcription and AI-powered minute generation' },
  { name: 'fixmystreet', description: 'NDX:Try FixMyStreet - Citizen problem reporting platform for UK councils' },
  { name: 'paperless-ngx', description: 'NDX:Try Paperless-ngx - Document archive with OCR, full-text search and Bedrock AI' },
  { name: 'planx', description: 'NDX:Try PlanX - Digital planning platform with Hasura + GraphQL' },
  { name: 'bops-planning', description: 'NDX:Try BOPS Planning - Back-Office Planning System with map tiles', parameterKeys: ['OSVectorTilesApiKey'] },
  { name: 'digital-planning-register', description: 'NDX:Try Digital Planning Register - Public-facing planning-application register' },
];

export class IsbHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Scenario parameters: secrets injected at deploy time, forwarded to StackSets.
    const govUkPayApiKey = new cdk.CfnParameter(this, 'GovUkPayApiKey', {
      type: 'String',
      noEcho: true,
      default: '',
      description: 'GOV.UK Pay sandbox API key (for localgov-ims scenario)',
    });

    const osVectorTilesApiKey = new cdk.CfnParameter(this, 'OSVectorTilesApiKey', {
      type: 'String',
      noEcho: true,
      default: '',
      description: 'Ordnance Survey Vector Tiles API key (for bops-planning scenario; empty = map tiles will not render)',
    });

    const scenarioParamValues: Record<string, string> = {
      GovUkPayApiKey: govUkPayApiKey.valueAsString,
      OSVectorTilesApiKey: osVectorTilesApiKey.valueAsString,
    };

    // Imported: the bucket lives in us-east-1 and its policy is managed there directly.
    const bucket = s3.Bucket.fromBucketName(this, 'BlueprintsBucket', BLUEPRINTS_BUCKET_NAME);

    // One BucketDeployment per scenario. Missing local templates are skipped
    // (CI synthesises every scenario before this stack; locally the skip lets
    // operators iterate on hub config without building every scenario).
    const deployments: Record<string, s3deploy.BucketDeployment> = {};
    const skipped: string[] = [];

    for (const scenario of SCENARIOS) {
      const pascalName = scenario.name
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      // SAM-style scenarios source from dist/ (produced by `sam package`); others
      // from the scenario root.
      const sourceDir = scenario.samStyle
        ? path.join(__dirname, '..', '..', 'scenarios', scenario.name, 'dist')
        : path.join(__dirname, '..', '..', 'scenarios', scenario.name);

      const templatePath = path.join(sourceDir, 'template.yaml');
      if (!fs.existsSync(templatePath)) {
        if (process.env.CI === 'true') {
          throw new Error(`Missing template for scenario '${scenario.name}': ${templatePath}. CI must synthesize this scenario before the hub stack runs.`);
        }
        console.warn(`[isb-hub] WARN: skipping scenario '${scenario.name}' — no template at ${templatePath} (run the synth step locally first if you want it deployed)`);
        skipped.push(scenario.name);
        continue;
      }

      const deployment = new s3deploy.BucketDeployment(this, `${pascalName}Templates`, {
        sources: [
          s3deploy.Source.asset(sourceDir, {
            exclude: ['*', '!template.yaml'],
          }),
        ],
        destinationBucket: bucket,
        destinationKeyPrefix: `scenarios/${scenario.name}`,
        // Never prune. The deploy-blueprints workflow uploads scenario-specific
        // out-of-band content (sam-package Lambda zips for SAM scenarios,
        // CDK-synthesized asset zips + website-build/ for simply-readable,
        // etc.) to scenarios/<name>/* BEFORE this BucketDeployment runs. The
        // BD's source contains only template.yaml; with prune:true (the
        // default for non-SAM) it would delete everything else under the
        // prefix every hub deploy, which is why simply-readable's lease
        // deploys started failing with NoSuchKey on Lambda assets.
        prune: false,
      });

      // CDK can't auto-grant on imported buckets.
      bucket.grantReadWrite(deployment.handlerRole);

      deployments[scenario.name] = deployment;
    }

    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubOidc',
      `arn:aws:iam::${HUB_ACCOUNT}:oidc-provider/token.actions.githubusercontent.com`,
    );

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

    // One StackSet per scenario; ISB owns the stack instances.
    for (const scenario of SCENARIOS) {
      if (skipped.includes(scenario.name)) continue;

      const pascalName = scenario.name
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      const templatePath = scenario.samStyle
        ? path.join(__dirname, '..', '..', 'scenarios', scenario.name, 'dist', 'template.yaml')
        : path.join(__dirname, '..', '..', 'scenarios', scenario.name, 'template.yaml');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const contentHash = crypto.createHash('sha256').update(templateContent).digest('hex').substring(0, 16);

      const stackSetProps: cfn.CfnStackSetProps = {
        stackSetName: `ndx-try-${scenario.name}`,
        permissionModel: 'SELF_MANAGED',
        administrationRoleArn: `arn:aws:iam::${HUB_ACCOUNT}:role/InnovationSandbox-${ISB_NAMESPACE}-IntermediateRole`,
        executionRoleName: `InnovationSandbox-${ISB_NAMESPACE}-SandboxAccountRole`,
        capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        managedExecution: { Active: true },
        templateUrl: `https://${BLUEPRINTS_BUCKET_NAME}.s3.${BLUEPRINTS_BUCKET_REGION}.amazonaws.com/scenarios/${scenario.name}/template.yaml`,
        description: `${scenario.description} [${contentHash}]`,
        ...(scenario.parameterKeys?.length ? {
          parameters: scenario.parameterKeys.map(key => ({
            parameterKey: key,
            parameterValue: scenarioParamValues[key] ?? '',
          })),
        } : {}),
      };

      const stackSet = new cfn.CfnStackSet(this, `${pascalName}StackSet`, stackSetProps);
      stackSet.node.addDependency(deployments[scenario.name]);
    }

    new cdk.CfnOutput(this, 'DeployRoleArn', {
      value: deployRole.roleArn,
      description: 'GitHub Actions deploy role ARN',
    });

    new cdk.CfnOutput(this, 'BlueprintsBucketName', {
      value: BLUEPRINTS_BUCKET_NAME,
      description: 'S3 bucket for ISB blueprint templates',
    });

    // Lambda relay for the ISB lease API. GitHub-hosted runners' Azure IPs
    // are blocked by the upstream ISB WAF (AWSManagedRulesAnonymousIpList
    // -> HostingProviderIPList). CI invokes this Lambda via boto3; the
    // Lambda makes the actual HTTPS call from AWS IP space, which the WAF
    // allows. JWT signing happens INSIDE the Lambda so the JWT secret is
    // never exposed to a GHA-OIDC principal — only this function reads it.
    const leaseProxyLogGroup = new logs.LogGroup(this, 'IsbLeaseProxyLogs', {
      logGroupName: '/aws/lambda/isb-lease-proxy',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const leaseProxyFn = new lambda.Function(this, 'IsbLeaseProxy', {
      functionName: 'isb-lease-proxy',
      description: 'Proxies ISB lease API calls from GHA CI through AWS IP space (WAF allow-listed).',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'lease-proxy')),
      // 15 min = Lambda max. Acquire polls until lease is Active; manual
      // testing shows 2-10 min typical, with cold-start scenarios (planx,
      // localgov-drupal) closer to 15 min. Release + list-orphans return
      // in seconds — only acquire actually uses the budget.
      timeout: cdk.Duration.minutes(15),
      memorySize: 256,
      logGroup: leaseProxyLogGroup,
      // Tight env: secret path and region only — no embedded JWT, no roles.
      environment: {
        ISB_JWT_SECRET_PATH: ISB_JWT_SECRET_NAME,
        ISB_JWT_SECRET_REGION: ISB_JWT_SECRET_REGION,
      },
    });

    // Lambda needs to read the JWT secret + decrypt via its KMS CMK.
    leaseProxyFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${ISB_JWT_SECRET_REGION}:${HUB_ACCOUNT}:secret:${ISB_JWT_SECRET_NAME}*`,
        ],
      }),
    );
    leaseProxyFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `secretsmanager.${ISB_JWT_SECRET_REGION}.amazonaws.com`,
          },
        },
      }),
    );

    // CI lease role: per-scenario CI workflows assume this via GHA OIDC.
    // Permissions are tight by design — only invoke the lease-proxy Lambda
    // and assume CIDeployRole. No direct ISB API or secret access. Trust
    // is widened to any ref so PRs (not just main) can use it; access is
    // gated at the workflow layer via the smoke-test-deploy GitHub
    // environment (CODEOWNERS-approval).
    const ciLeaseRole = new iam.Role(this, 'GitHubActionsCiLeaseRole', {
      roleName: CI_LEASE_ROLE_NAME,
      description: 'GHA OIDC role assumed by per-scenario CI workflows to invoke the lease-proxy Lambda and assume CIDeployRole in the leased pool account.',
      maxSessionDuration: cdk.Duration.hours(6),
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': `repo:${GITHUB_REPO}:*`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    leaseProxyFn.grantInvoke(ciLeaseRole);

    // Assume CIDeployRole in whichever account the lease lands us in.
    // Deployed to all pool accounts by the Isb-ndx-CIDeployRole StackSet
    // owned by cloudformation/isb-hub-orgmgmt/.
    ciLeaseRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::*:role/InnovationSandbox-${ISB_NAMESPACE}-CIDeployRole`,
        ],
      }),
    );

    new cdk.CfnOutput(this, 'CiLeaseRoleArn', {
      value: ciLeaseRole.roleArn,
      description: 'GHA OIDC role for per-scenario CI lease workflows',
    });

    new cdk.CfnOutput(this, 'IsbLeaseProxyFunctionName', {
      value: leaseProxyFn.functionName,
      description: 'Lambda function name for the ISB lease API proxy',
    });
  }
}
