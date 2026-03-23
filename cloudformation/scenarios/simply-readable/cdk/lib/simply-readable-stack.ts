import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_iam as iam,
  aws_s3 as s3,
  aws_cognito as cognito,
  aws_lambda as lambda,
  aws_servicecatalogappregistry as appregistry,
} from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import * as crypto from "crypto";

// Upstream constructs — resolved relative to THIS file's location
import { dt_api } from "../../.upstream/infrastructure/lib/features/api";
import { dt_help } from "../../.upstream/infrastructure/lib/features/help";
import { dt_translate } from "../../.upstream/infrastructure/lib/features/translation/translation";
import { dt_readable } from "../../.upstream/infrastructure/lib/features/readable/readable";
import { dt_web } from "../../.upstream/infrastructure/lib/features/web";
import { dt_sharedPreferences } from "../../.upstream/infrastructure/lib/features/preferences";

export class SimplyReadableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const removalPolicy = cdk.RemovalPolicy.DESTROY;

    // Blueprints bucket containing pre-built website assets.
    // Defaults to the ISB hub account's bucket (cross-account read via bucket policy).
    const blueprintsBucketParam = new cdk.CfnParameter(
      this,
      "BlueprintsBucketName",
      {
        type: "String",
        default: "ndx-try-isb-blueprints-568672915267",
        description: "S3 bucket containing website assets",
      },
    );
    const blueprintsBucketName = blueprintsBucketParam.valueAsString;

    // Tags
    cdk.Tags.of(this).add("Project", "ndx-try-aws-scenarios");
    cdk.Tags.of(this).add("Scenario", "simply-readable");
    cdk.Tags.of(this).add("AutoCleanup", "true");

    // AppRegistry Application - visible in myApplications on the AWS Console
    const appRegistryApp = new appregistry.CfnApplication(
      this,
      "AppRegistryApplication",
      {
        name: `NDXTry_Simply_Readable_${this.account}`,
        description:
          "NDX:Try - Document Translation & Easy Read with Bedrock AI",
        tags: { Project: "ndx-try", Scenario: "simply-readable" },
      },
    );

    new appregistry.CfnResourceAssociation(
      this,
      "AppRegistryAssociation",
      {
        application: appRegistryApp.attrId,
        resource: this.stackId,
        resourceType: "CFN_STACK",
      },
    );

    cdk.Tags.of(this).add("awsApplication", appRegistryApp.attrArn, {
      excludeResourceTypes: ["AWS::ServiceCatalogAppRegistry::Application", "AWS::ServiceCatalogAppRegistry::ResourceAssociation"],
    });

    // ========================================================================
    // SERVER ACCESS LOGGING BUCKET (same as upstream DocTranStack)
    // ========================================================================
    const serverAccessLoggingBucket = new s3.Bucket(
      this,
      "serverAccessLoggingBucket",
      {
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        versioned: true,
        removalPolicy,
      },
    );
    NagSuppressions.addResourceSuppressions(
      serverAccessLoggingBucket,
      [
        {
          id: "AwsSolutions-S1",
          reason:
            "This bucket is the AccessLogs destination bucket for other buckets.",
        },
      ],
      true,
    );

    // ========================================================================
    // API (upstream dt_api — Cognito + AppSync + WAF)
    // ========================================================================
    const base_api = new dt_api(this, "base_api", {
      instanceName: "ndx-sr",
      cognitoLocalUsers: true,
      cognitoLocalUsersMfa: "off",
      cognitoLocalUsersMfaOtp: false,
      cognitoLocalUsersMfaSms: false,
      cognitoSamlUsers: false,
      removalPolicy,
    });

    // ========================================================================
    // HELP (upstream dt_help)
    // ========================================================================
    new dt_help(this, "base_help", {
      api: base_api.api,
      apiSchema: base_api.apiSchema,
      removalPolicy,
    });

    // ========================================================================
    // SHARED PREFERENCES (upstream dt_sharedPreferences)
    // ========================================================================
    new dt_sharedPreferences(this, "base_sharedPreferences", {
      api: base_api.api,
      apiSchema: base_api.apiSchema,
      removalPolicy,
    });

    // ========================================================================
    // TRANSLATION (upstream dt_translate)
    // ========================================================================
    const base_translate = new dt_translate(this, "base_translate", {
      serverAccessLoggingBucket,
      contentLifecycleDefault: 7,
      contentLifecyclePii: 3,
      s3PrefixPrivate: "private",
      identityPool: base_api.identityPool,
      api: base_api.api,
      apiSchema: base_api.apiSchema,
      removalPolicy,
      translationPii: false,
    });

    // ========================================================================
    // READABLE (upstream dt_readable)
    // ========================================================================
    const base_readable = new dt_readable(this, "base_readable", {
      api: base_api.api,
      apiSchema: base_api.apiSchema,
      bedrockRegion: "us-east-1",
      identityPool: base_api.identityPool,
      removalPolicy,
      serverAccessLoggingBucket,
    });

    // ========================================================================
    // WEB (upstream dt_web — S3 + CloudFront)
    // ========================================================================
    const signOutSuffix = "signout";
    const base_web = new dt_web(this, "base_web", {
      serverAccessLoggingBucket,
      userPoolClient: base_api.userPoolClient,
      removalPolicy,
      webUiCustomDomain: "",
      webUiCustomDomainCertificate: "",
      signOutSuffix,
      development: false,
    });

    // ========================================================================
    // ISB OVERLAY: Grant authenticated users IAM access to AppSync
    // (needed for Amplify client with Cognito Identity Pool auth)
    // ========================================================================
    base_api.identityPool.authenticatedRole.attachInlinePolicy(
      new iam.Policy(this, "AuthenticatedAppSyncPolicy", {
        policyName: "AppSync-GraphQL-Access",
        statements: [
          new iam.PolicyStatement({
            actions: ["appsync:GraphQL"],
            resources: [
              `arn:aws:appsync:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:apis/${base_api.api.apiId}/*`,
            ],
          }),
        ],
      }),
    );

    // ========================================================================
    // ISB OVERLAY: Admin user Custom Resource
    // Creates admin user in Cognito with random password (no Secrets Manager)
    // ========================================================================
    const adminUser = new cognito.CfnUserPoolUser(this, "AdminUser", {
      userPoolId: base_api.userPool.userPoolId,
      username: "admin",
      userAttributes: [
        { name: "email", value: "admin@ndx-try.local" },
        { name: "email_verified", value: "true" },
      ],
    });

    const setPasswordRole = new iam.Role(this, "SetPasswordRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });
    setPasswordRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminSetUserPassword"],
        resources: [base_api.userPool.userPoolArn],
      }),
    );

    const setPasswordFn = new lambda.CfnFunction(this, "SetPasswordFn", {
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: setPasswordRole.roleArn,
      timeout: 30,
      code: {
        zipFile: SET_PASSWORD_LAMBDA_CODE,
      },
    });
    setPasswordFn.addDependency(adminUser);

    const setPasswordCR = new cdk.CustomResource(this, "SetPasswordCR", {
      serviceToken: cdk.Fn.getAtt(setPasswordFn.logicalId, "Arn").toString(),
      properties: {
        UserPoolId: base_api.userPool.userPoolId,
      },
    });
    setPasswordCR.node.addDependency(setPasswordRole);
    const adminPassword = setPasswordCR.getAttString("Password");

    // ========================================================================
    // ISB OVERLAY: Model seed override
    // The upstream dt_readable seeds models that don't work in ISB
    // (Anthropic/Stability via cross-region profiles). We seed ISB-compatible
    // models and enable Bedrock model agreements.
    // ========================================================================
    const seedRole = new iam.Role(this, "IsbSeedRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });
    seedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:DeleteItem",
        ],
        resources: ["*"], // model table ARN not directly accessible — scoped by ISB SCP
      }),
    );
    seedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:ListFoundationModelAgreementOffers",
          "bedrock:CreateFoundationModelAgreement",
          "bedrock:GetFoundationModelAvailability",
        ],
        resources: ["*"],
      }),
    );
    seedRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "aws-marketplace:Subscribe",
          "aws-marketplace:Unsubscribe",
          "aws-marketplace:ViewSubscriptions",
        ],
        resources: ["*"],
      }),
    );

    const seedFn = new lambda.CfnFunction(this, "IsbSeedFn", {
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: seedRole.roleArn,
      timeout: 120,
      code: {
        zipFile: ISB_SEED_LAMBDA_CODE,
      },
    });

    // We need the model table name — the upstream construct stores it internally.
    // The dt_readableModel creates a table named "modelTable" under dt_readable > readableModel.
    // The print style table is at: base_readable > readablePrintStyles > printStyleTable
    // We search by construct path.

    const seedCR = new cdk.CfnCustomResource(this, "IsbSeedCR", {
      serviceToken: cdk.Fn.getAtt(seedFn.logicalId, "Arn").toString(),
    });
    // Pass the model table and print style table via finding the DDB tables in the construct tree
    const readableNode = base_readable.node;
    const modelTableNode = readableNode
      .findChild("readableModel")
      .node.findChild("modelTable")
      .node.findChild("Resource") as cdk.CfnResource;
    const printStyleTableNode = readableNode
      .findChild("readablePrintStyles")
      .node.findChild("printStyleTable")
      .node.findChild("Resource") as cdk.CfnResource;

    seedCR.addPropertyOverride("ModelTableName", modelTableNode.ref);
    seedCR.addPropertyOverride("PrintStyleTableName", printStyleTableNode.ref);
    seedCR.node.addDependency(seedRole);
    // Ensure the upstream model seed CRs complete first, then we overwrite
    seedCR.node.addDependency(readableNode.findChild("readableModel"));
    seedCR.node.addDependency(readableNode.findChild("readablePrintStyles"));

    // ========================================================================
    // ISB OVERLAY: Website deploy Custom Resource
    // Copies pre-built website from blueprints S3 bucket to website bucket,
    // writes config.js with runtime CloudFormation output values,
    // invalidates CloudFront.
    // ========================================================================
    const deployRole = new iam.Role(this, "WebDeployRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // S3 permissions: read from blueprints, read/write/delete to website bucket
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [
          cdk.Fn.join("", ["arn:aws:s3:::", blueprintsBucketName]),
          cdk.Fn.join("", ["arn:aws:s3:::", blueprintsBucketName, "/*"]),
        ],
      }),
    );
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ],
        resources: [
          base_web.websiteBucket.bucketArn,
          `${base_web.websiteBucket.bucketArn}/*`,
        ],
      }),
    );
    // CloudFront invalidation
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          cdk.Fn.sub(
            "arn:aws:cloudfront::${AWS::AccountId}:distribution/${DistId}",
            { DistId: base_web.websiteDistribution.distributionId },
          ),
        ],
      }),
    );

    const deployFn = new lambda.CfnFunction(this, "WebDeployFn", {
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: deployRole.roleArn,
      timeout: 300,
      memorySize: 512,
      code: {
        zipFile: DEPLOY_LAMBDA_CODE,
      },
    });

    const deployCR = new cdk.CfnCustomResource(this, "WebDeployCR", {
      serviceToken: cdk.Fn.getAtt(deployFn.logicalId, "Arn").toString(),
    });
    deployCR.addPropertyOverride("SourceBucket", blueprintsBucketName);
    deployCR.addPropertyOverride(
      "SourcePrefix",
      "scenarios/simply-readable/website-build",
    );
    deployCR.addPropertyOverride(
      "DestBucket",
      base_web.websiteBucket.bucketName,
    );
    deployCR.addPropertyOverride(
      "DistributionId",
      base_web.websiteDistribution.distributionId,
    );
    deployCR.addPropertyOverride("Region", cdk.Aws.REGION);
    deployCR.addPropertyOverride("UserPoolId", base_api.userPool.userPoolId);
    deployCR.addPropertyOverride(
      "UserPoolClientId",
      base_api.userPoolClient.userPoolClientId,
    );
    deployCR.addPropertyOverride(
      "IdentityPoolId",
      base_api.identityPool.identityPoolId,
    );
    deployCR.addPropertyOverride(
      "CognitoDomain",
      base_api.userPoolDomain.domainName,
    );
    deployCR.addPropertyOverride("AppSyncEndpoint", base_api.api.graphqlUrl);
    deployCR.addPropertyOverride(
      "TranslationBucket",
      base_translate.contentBucket.bucketName,
    );
    deployCR.addPropertyOverride(
      "ReadableBucket",
      base_readable.contentBucket.bucketName,
    );
    deployCR.addPropertyOverride(
      "CloudFrontDomain",
      base_web.websiteDistribution.domainName,
    );
    // Force update on each deployment
    deployCR.addPropertyOverride("Timestamp", Date.now().toString());
    deployCR.node.addDependency(deployRole);

    // ========================================================================
    // ISB OVERLAY: Empty bucket Custom Resources
    // For clean stack deletion (autoDeleteObjects requires CDK bootstrap)
    // ========================================================================
    const emptyBucketRole = new iam.Role(this, "EmptyBucketRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });
    const bucketsToEmpty = [
      base_translate.contentBucket,
      base_readable.contentBucket,
      base_web.websiteBucket,
      serverAccessLoggingBucket,
    ];
    emptyBucketRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:ListBucketVersions",
          "s3:DeleteObjectVersion",
        ],
        resources: bucketsToEmpty.flatMap((b) => [
          b.bucketArn,
          `${b.bucketArn}/*`,
        ]),
      }),
    );

    const emptyBucketFn = new lambda.Function(this, "EmptyBucketFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      role: emptyBucketRole,
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(EMPTY_BUCKET_LAMBDA_CODE),
    });

    const bucketNames = [
      "TranslationContent",
      "ReadableContent",
      "Website",
      "Log",
    ];
    bucketsToEmpty.forEach((bucket, i) => {
      const cr = new cdk.CfnCustomResource(
        this,
        `EmptyBucket${bucketNames[i]}`,
        {
          serviceToken: emptyBucketFn.functionArn,
        },
      );
      cr.addPropertyOverride("BucketName", bucket.bucketName);
      cr.node.addDependency(emptyBucketRole);
    });

    // ========================================================================
    // CLOUDFORMATION OUTPUTS
    // ========================================================================
    new cdk.CfnOutput(this, "AppUrl", {
      description: "Simply Readable web application URL",
      value: `https://${base_web.websiteDistribution.domainName}`,
    });
    new cdk.CfnOutput(this, "AdminUsername", {
      description: "Admin username for login",
      value: "admin",
    });
    new cdk.CfnOutput(this, "AdminPassword", {
      description: "Admin password for login",
      value: adminPassword,
    });
    new cdk.CfnOutput(this, "CognitoUserPoolId", {
      description: "Cognito User Pool ID",
      value: base_api.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "CognitoUserPoolClientId", {
      description: "Cognito User Pool Client ID",
      value: base_api.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "AppSyncEndpoint", {
      description: "AppSync GraphQL API endpoint",
      value: base_api.api.graphqlUrl,
    });
    new cdk.CfnOutput(this, "TranslationContentBucketName", {
      description: "S3 bucket for translation documents",
      value: base_translate.contentBucket.bucketName,
    });
    new cdk.CfnOutput(this, "ReadableContentBucketName", {
      description: "S3 bucket for readable documents",
      value: base_readable.contentBucket.bucketName,
    });
  }

  /**
   * ISB SCP requires all IAM roles to have names matching 'InnovationSandbox-ndx-*'.
   * Roles without this prefix are denied all AWS API calls by the SCP.
   *
   * This override post-processes the resolved CloudFormation template to inject
   * role names. CDK Aspects with addPropertyOverride don't work here because
   * upstream constructs use a different aws-cdk-lib version, and cross-module
   * property overrides are lost during synthesis.
   */
  protected _toCloudFormation(): any {
    const template = super._toCloudFormation();
    const resources = template?.Resources;
    if (resources) {
      for (const [logicalId, resource] of Object.entries(resources) as [
        string,
        any,
      ][]) {
        if (resource?.Type === "AWS::IAM::Role") {
          const hash = crypto
            .createHash("md5")
            .update(logicalId)
            .digest("hex")
            .substring(0, 8);
          const meaningful = logicalId
            .replace(/[A-F0-9]{8}$/, "") // strip CDK hash suffix
            .replace(/[^a-zA-Z0-9-]/g, "")
            .slice(0, 33);
          // Keep total <= 64 chars: 'InnovationSandbox-ndx-' (22) + name (<=33) + '-' (1) + hash (8) = 64
          if (!resource.Properties) resource.Properties = {};
          resource.Properties.RoleName = `InnovationSandbox-ndx-${meaningful}-${hash}`;

          // Add bedrock:InvokeModel and aws-marketplace permissions to all Lambda roles
          // The upstream CDK constructs rely on cross-region inference profiles and
          // grant permissions differently. For ISB, the invokeBedrock Lambda roles
          // need direct InvokeModel + Marketplace permissions.
          const policies = resource.Properties.Policies || [];
          const hasBedrock = policies.some(
            (p: any) =>
              p.PolicyDocument?.Statement?.some((s: any) =>
                (s.Action || []).some?.((a: string) =>
                  a.startsWith("bedrock:"),
                ) || s.Action === "bedrock:InvokeModel",
              ),
          );
          if (!hasBedrock) {
            policies.push({
              PolicyName: "ISB-BedrockAccess",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [
                      "bedrock:InvokeModel",
                      "bedrock:InvokeModelWithResponseStream",
                    ],
                    Resource: "*",
                  },
                  {
                    Effect: "Allow",
                    Action: [
                      "aws-marketplace:ViewSubscriptions",
                      "aws-marketplace:Subscribe",
                    ],
                    Resource: "*",
                  },
                ],
              },
            });
            resource.Properties.Policies = policies;
          }
        }
      }
    }
    return template;
  }
}

// ============================================================================
// INLINE LAMBDA CODE
// ============================================================================

// Admin password setter — generates password in-Lambda to avoid Secrets Manager (blocked by ISB SCP)
const SET_PASSWORD_LAMBDA_CODE = `const{CognitoIdentityProviderClient,AdminSetUserPasswordCommand}=require("@aws-sdk/client-cognito-identity-provider");const c=require("crypto");const r=require("https");exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}try{const pw=c.randomBytes(12).toString("base64").slice(0,16).replace(/\\+/g,"!")+"A1a!";const cog=new CognitoIdentityProviderClient();await cog.send(new AdminSetUserPasswordCommand({UserPoolId:e.ResourceProperties.UserPoolId,Username:"admin",Password:pw,Permanent:true}));rp.Data={Password:pw};await send(e.ResponseURL,rp)}catch(err){rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=r.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;

// ISB model seed — clears upstream models and seeds ISB-compatible ones, enables agreements
const ISB_SEED_LAMBDA_CODE = [
  'const{DynamoDBClient,PutItemCommand,ScanCommand,DeleteItemCommand}=require("@aws-sdk/client-dynamodb");',
  'const{BedrockClient,ListFoundationModelAgreementOffersCommand,CreateFoundationModelAgreementCommand,GetFoundationModelAvailabilityCommand}=require("@aws-sdk/client-bedrock");',
  'const https=require("https");',
  "exports.handler=async(e)=>{",
  '  const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId};',
  '  if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}',
  "  try{",
  "    const db=new DynamoDBClient();const br=new BedrockClient();const p=e.ResourceProperties;",
  "    // Clear existing upstream-seeded models",
  "    const existing=await db.send(new ScanCommand({TableName:p.ModelTableName}));",
  "    if(existing.Items){for(const item of existing.Items){await db.send(new DeleteItemCommand({TableName:p.ModelTableName,Key:{id:item.id}}))}}",
  "    // Seed ISB-compatible models",
  '    const textModel={id:"anthropic.claude-3-haiku-20240307-v1:0",name:"Claude 3 Haiku",type:"text"};',
  '    const imageModel={id:"amazon.nova-canvas-v1:0",name:"Amazon Nova Canvas",type:"image"};',
  '    // Text model: needs nested text object with modelId, parameters (anthropic_version, max_tokens), prePrompt',
  '    await db.send(new PutItemCommand({TableName:p.ModelTableName,Item:{id:{S:textModel.id},modelId:{S:textModel.id},name:{S:textModel.name},type:{S:textModel.type},default:{BOOL:true},text:{M:{modelId:{S:textModel.id},parameters:{M:{anthropic_version:{S:"bedrock-2023-05-31"},max_tokens:{N:"2048"}}},prePrompt:{S:"Simplify the following text so it can be easily understood by those with a low reading age. Use short sentences, explain any abbreviations or words that can have two meanings, and separate the sentences into new lines."}}}}}));',
  '    // Image model: needs nested image object AND text object (for generating image prompts)',
  '    await db.send(new PutItemCommand({TableName:p.ModelTableName,Item:{id:{S:imageModel.id},modelId:{S:imageModel.id},name:{S:imageModel.name},type:{S:imageModel.type},default:{BOOL:true},image:{M:{modelId:{S:imageModel.id},parameters:{M:{}}}},text:{M:{modelId:{S:textModel.id},parameters:{M:{InferenceConfig:{M:{MaxTokens:{N:"512"},Temperature:{N:"0.7"},TopP:{N:"0.9"}}}}},prePrompt:{S:"You are a prompt engineer trying to design a prompt for an image generation model so it can generate a photographic image to illustrate the following text showing no people in the image:"}}}}}));',
  "    const models=[textModel,imageModel];",
  "    for(const m of models){",
  "      try{",
  "        const avail=await br.send(new GetFoundationModelAvailabilityCommand({modelId:m.id}));",
  '        const agStatus=avail.agreementAvailability&&avail.agreementAvailability.status;',
  '        if(agStatus!=="AVAILABLE"){',
  "          const offers=await br.send(new ListFoundationModelAgreementOffersCommand({modelId:m.id}));",
  "          const offerList=offers.offers||offers.modelAgreementOffers||[];",
  "          if(offerList.length>0){",
  "            await br.send(new CreateFoundationModelAgreementCommand({modelId:m.id,offerToken:offerList[0].offerToken}));",
  '            console.log("Enabled model agreement for",m.id)',
  "          }",
  '        }else{console.log("Model already available:",m.id)}',
  '      }catch(err){console.warn("Could not enable model agreement for",m.id,err.message)}',
  "    }",
  "    // Seed ISB print style (clear and re-add)",
  "    const existingStyles=await db.send(new ScanCommand({TableName:p.PrintStyleTableName}));",
  "    if(existingStyles.Items){for(const item of existingStyles.Items){await db.send(new DeleteItemCommand({TableName:p.PrintStyleTableName,Key:{id:item.id}}))}}",
  '    const styles=[{id:"default",name:"Default",type:"default",default:true}];',
  "    for(const s of styles){await db.send(new PutItemCommand({TableName:p.PrintStyleTableName,Item:{id:{S:s.id},name:{S:s.name},type:{S:s.type},default:{BOOL:s.default}}}))}",
  "    await send(e.ResponseURL,rp)",
  '  }catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}',
  "};",
  'function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}',
].join("\n");

// Website deploy — copies from blueprints bucket, writes config.js, invalidates CloudFront
const DEPLOY_LAMBDA_CODE = `const{S3Client,ListObjectsV2Command,GetObjectCommand,PutObjectCommand}=require("@aws-sdk/client-s3");const{CloudFrontClient,CreateInvalidationCommand}=require("@aws-sdk/client-cloudfront");const https=require("https");
exports.handler=async(e,ctx)=>{const p=e.ResourceProperties;const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId||"deploy",StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId};
try{const s3=new S3Client();const cf=new CloudFrontClient();
if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}
let ct;do{const r=await s3.send(new ListObjectsV2Command({Bucket:p.SourceBucket,Prefix:p.SourcePrefix,ContinuationToken:ct}));if(r.Contents){for(const o of r.Contents){const k=o.Key.replace(p.SourcePrefix+"/","");const g=await s3.send(new GetObjectCommand({Bucket:p.SourceBucket,Key:o.Key}));const b=await g.Body.transformToByteArray();const mt=k.endsWith(".html")?"text/html":k.endsWith(".js")?"application/javascript":k.endsWith(".css")?"text/css":k.endsWith(".json")?"application/json":k.endsWith(".svg")?"image/svg+xml":"application/octet-stream";await s3.send(new PutObjectCommand({Bucket:p.DestBucket,Key:k,Body:b,ContentType:mt}))}}ct=r.NextContinuationToken}while(ct);
const cfg="window.__DOCTRAN_CONFIG__="+JSON.stringify({awsRegion:p.Region,awsUserPoolsId:p.UserPoolId,awsUserPoolsWebClientId:p.UserPoolClientId,awsCognitoIdentityPoolId:p.IdentityPoolId,awsCognitoOauthDomain:p.CognitoDomain,awsCognitoOauthRedirectSignIn:"https://"+p.CloudFrontDomain+"/",awsCognitoOauthRedirectSignOut:"https://"+p.CloudFrontDomain+"/signout",awsAppsyncGraphqlEndpoint:p.AppSyncEndpoint,awsUserFilesS3Bucket:p.TranslationBucket,awsTranslationFilesS3Bucket:p.TranslationBucket,awsReadableFilesS3Bucket:p.ReadableBucket,awsReadableS3Bucket:p.ReadableBucket})+";";
await s3.send(new PutObjectCommand({Bucket:p.DestBucket,Key:"config.js",Body:cfg,ContentType:"application/javascript",CacheControl:"no-cache"}));
await cf.send(new CreateInvalidationCommand({DistributionId:p.DistributionId,InvalidationBatch:{CallerReference:Date.now().toString(),Paths:{Quantity:1,Items:["/*"]}}}));
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;

// Empty bucket — clears all objects/versions from a bucket on stack deletion
const EMPTY_BUCKET_LAMBDA_CODE = `const{S3Client,ListObjectVersionsCommand,DeleteObjectsCommand}=require("@aws-sdk/client-s3");const https=require("https");
exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
try{if(e.RequestType==="Delete"){const s3=new S3Client();const b=e.ResourceProperties.BucketName;let k;do{const r=await s3.send(new ListObjectVersionsCommand({Bucket:b,KeyMarker:k}));const objs=[...(r.Versions||[]).map(v=>({Key:v.Key,VersionId:v.VersionId})),...(r.DeleteMarkers||[]).map(v=>({Key:v.Key,VersionId:v.VersionId}))];if(objs.length>0){for(let i=0;i<objs.length;i+=1000){await s3.send(new DeleteObjectsCommand({Bucket:b,Delete:{Objects:objs.slice(i,i+1000),Quiet:true}}))}}k=r.IsTruncated?r.NextKeyMarker:undefined}while(k)}
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;
