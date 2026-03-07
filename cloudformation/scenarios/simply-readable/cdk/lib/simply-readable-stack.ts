import * as cdk from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import {
  aws_appsync as appsync,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
} from 'aws-cdk-lib';
import * as crypto from 'crypto';
import { AuthConstruct } from './constructs/auth';
import { ApiConstruct } from './constructs/api';
import { WebConstruct } from './constructs/web';
import { TranslationConstruct } from './constructs/translation';
import { ReadableConstruct } from './constructs/readable';

/**
 * ISB SCP requires all IAM roles to have names matching 'InnovationSandbox-ndx-*'.
 * Roles without this prefix are denied all AWS API calls by the SCP.
 */
class IsbRoleNamingAspect implements cdk.IAspect {
  visit(node: IConstruct) {
    if (node instanceof iam.CfnRole) {
      const path = node.node.path;
      const hash = crypto.createHash('md5').update(path).digest('hex').substring(0, 8);
      const parts = path.split('/');
      const meaningful = parts.slice(1, -1).join('-')
        .replace(/Role$/, '').replace(/Default$/, '')
        .replace(/[^a-zA-Z0-9-]/g, '');
      // Keep total ≤ 64 chars: 'InnovationSandbox-ndx-' (22) + name (≤33) + '-' (1) + hash (8) = 64
      const name = meaningful.slice(0, 33);
      node.addPropertyOverride('RoleName', `InnovationSandbox-ndx-${name}-${hash}`);
    }
  }
}

export class SimplyReadableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply ISB role naming to all IAM roles in this stack
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());

    const removalPolicy = cdk.RemovalPolicy.DESTROY;

    // Blueprints bucket containing Lambda code zips and website assets.
    // Defaults to the ISB hub account's bucket (cross-account read via bucket policy).
    // Override for direct deploys to an account with its own blueprints bucket.
    const blueprintsBucketParam = new cdk.CfnParameter(this, 'BlueprintsBucketName', {
      type: 'String',
      default: 'ndx-try-isb-blueprints-568672915267',
      description: 'S3 bucket containing Lambda code and website assets',
    });
    const blueprintsBucketName = blueprintsBucketParam.valueAsString;

    // Tags
    cdk.Tags.of(this).add('Project', 'ndx-try-aws-scenarios');
    cdk.Tags.of(this).add('Scenario', 'simply-readable');
    cdk.Tags.of(this).add('AutoCleanup', 'true');

    // Authentication (Cognito User Pool + Identity Pool)
    const auth = new AuthConstruct(this, 'Auth', { removalPolicy });

    // API Layer (AppSync GraphQL + WAF)
    const api = new ApiConstruct(this, 'Api', {
      userPool: auth.userPool,
      removalPolicy,
    });

    // Grant authenticated users IAM access to AppSync (used by Amplify client)
    auth.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['appsync:GraphQL'],
      resources: [`arn:aws:appsync:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:apis/${api.apiId}/*`],
    }));

    // Shared AppSync resolvers (preferences, help)
    const sharedTable = new dynamodb.Table(this, 'SharedPreferencesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });
    const helpTable = new dynamodb.Table(this, 'HelpTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy,
    });

    const sharedDSRole = new iam.Role(this, 'SharedDSRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });
    sharedTable.grantReadWriteData(sharedDSRole);
    helpTable.grantReadData(sharedDSRole);

    const sharedDS = new appsync.CfnDataSource(this, 'SharedDataSource', {
      apiId: api.apiId,
      name: 'SharedPreferencesTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: { tableName: sharedTable.tableName, awsRegion: cdk.Aws.REGION },
      serviceRoleArn: sharedDSRole.roleArn,
    });
    const helpDS = new appsync.CfnDataSource(this, 'HelpDataSource', {
      apiId: api.apiId,
      name: 'HelpTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: { tableName: helpTable.tableName, awsRegion: cdk.Aws.REGION },
      serviceRoleArn: sharedDSRole.roleArn,
    });

    new appsync.CfnResolver(this, 'GetPreferencesResolver', {
      apiId: api.apiId, typeName: 'Query', fieldName: 'sharedGetPreferences',
      dataSourceName: sharedDS.attrName,
      requestMappingTemplate: `{"version":"2017-02-28","operation":"UpdateItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.identity.sub)},"update":{"expression":"SET #vm = if_not_exists(#vm, :dvm), #vd = if_not_exists(#vd, :dvd)","expressionNames":{"#vm":"visualMode","#vd":"visualDensity"},"expressionValues":{":dvm":{"S":"light"},":dvd":{"S":"comfortable"}}}}`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    new appsync.CfnResolver(this, 'UpdatePreferencesResolver', {
      apiId: api.apiId, typeName: 'Mutation', fieldName: 'sharedUpdatePreferences',
      dataSourceName: sharedDS.attrName,
      requestMappingTemplate: `{"version":"2017-02-28","operation":"PutItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.identity.sub)},"attributeValues":{"visualMode":$util.dynamodb.toDynamoDBJson($ctx.args.visualMode),"visualDensity":$util.dynamodb.toDynamoDBJson($ctx.args.visualDensity)}}`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });
    new appsync.CfnResolver(this, 'ListHelpsResolver', {
      apiId: api.apiId, typeName: 'Query', fieldName: 'helpListHelps',
      dataSourceName: helpDS.attrName,
      requestMappingTemplate: `{"version":"2017-02-28","operation":"Scan","limit":$util.defaultIfNull($ctx.args.limit,50)}`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });

    // Document Translation feature
    const translation = new TranslationConstruct(this, 'Translation', {
      removalPolicy,
      apiId: api.apiId,
      authenticatedRole: auth.authenticatedRole,
      blueprintsBucketName,
    });

    // Simply Readable (Easy Read) feature
    const readable = new ReadableConstruct(this, 'Readable', {
      removalPolicy,
      apiId: api.apiId,
      appSyncEndpoint: api.apiEndpoint,
      authenticatedRole: auth.authenticatedRole,
      blueprintsBucketName,
    });

    // Web UI (S3 + CloudFront + Config Injection)
    const web = new WebConstruct(this, 'Web', {
      removalPolicy,
      userPoolId: auth.userPool.userPoolId,
      userPoolClientId: auth.userPoolClient.userPoolClientId,
      identityPoolId: auth.identityPoolId,
      cognitoDomain: auth.cognitoDomain,
      appSyncEndpoint: api.apiEndpoint,
      translationContentBucketName: translation.contentBucket.bucketName,
      readableContentBucketName: readable.contentBucket.bucketName,
      blueprintsBucketName,
    });

    // Custom Resource to empty S3 buckets on stack deletion
    // (autoDeleteObjects requires CDK bootstrap which isn't available in StackSet-deployed accounts)
    const emptyBucketRole = new iam.Role(this, 'EmptyBucketRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    const bucketsToEmpty = [
      translation.contentBucket,
      readable.contentBucket,
      web.websiteBucket,
      web.logBucket,
    ];
    emptyBucketRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket', 's3:DeleteObject', 's3:ListBucketVersions', 's3:DeleteObjectVersion'],
      resources: bucketsToEmpty.flatMap(b => [b.bucketArn, `${b.bucketArn}/*`]),
    }));

    const emptyBucketFn = new cdk.aws_lambda.Function(this, 'EmptyBucketFn', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: emptyBucketRole,
      timeout: cdk.Duration.minutes(5),
      code: cdk.aws_lambda.Code.fromInline(`const{S3Client,ListObjectVersionsCommand,DeleteObjectsCommand}=require("@aws-sdk/client-s3");const https=require("https");
exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
try{if(e.RequestType==="Delete"){const s3=new S3Client();const b=e.ResourceProperties.BucketName;let k;do{const r=await s3.send(new ListObjectVersionsCommand({Bucket:b,KeyMarker:k}));const objs=[...(r.Versions||[]).map(v=>({Key:v.Key,VersionId:v.VersionId})),...(r.DeleteMarkers||[]).map(v=>({Key:v.Key,VersionId:v.VersionId}))];if(objs.length>0){for(let i=0;i<objs.length;i+=1000){await s3.send(new DeleteObjectsCommand({Bucket:b,Delete:{Objects:objs.slice(i,i+1000),Quiet:true}}))}}k=r.IsTruncated?r.NextKeyMarker:undefined}while(k)}
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`),
    });

    const bucketNames = ['TranslationContent', 'ReadableContent', 'Website', 'Log'];
    bucketsToEmpty.forEach((bucket, i) => {
      const cr = new cdk.CfnCustomResource(this, `EmptyBucket${bucketNames[i]}`, {
        serviceToken: emptyBucketFn.functionArn,
      });
      cr.addPropertyOverride('BucketName', bucket.bucketName);
      cr.node.addDependency(emptyBucketRole);
    });

    // Set OAuth callback URLs now that CloudFront domain is known
    const cfnClient = auth.userPoolClient.node.defaultChild as cdk.CfnResource;
    cfnClient.addPropertyOverride('CallbackURLs', [`https://${web.distributionDomainName}`]);
    cfnClient.addPropertyOverride('LogoutURLs', [`https://${web.distributionDomainName}`]);

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'AppUrl', {
      description: 'Simply Readable web application URL',
      value: `https://${web.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, 'AdminUsername', {
      description: 'Admin username for login',
      value: 'admin',
    });
    new cdk.CfnOutput(this, 'AdminPassword', {
      description: 'Admin password for login',
      value: auth.adminPassword,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      description: 'Cognito User Pool ID',
      value: auth.userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      description: 'Cognito User Pool Client ID',
      value: auth.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'AppSyncEndpoint', {
      description: 'AppSync GraphQL API endpoint',
      value: api.apiEndpoint,
    });
    new cdk.CfnOutput(this, 'TranslationContentBucketName', {
      description: 'S3 bucket for translation documents',
      value: translation.contentBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'ReadableContentBucketName', {
      description: 'S3 bucket for readable documents',
      value: readable.contentBucket.bucketName,
    });
  }
}
