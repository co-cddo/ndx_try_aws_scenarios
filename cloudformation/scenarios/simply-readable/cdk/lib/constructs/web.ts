import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_iam as iam,
  aws_lambda as lambda,
} from 'aws-cdk-lib';

export interface WebConstructProps {
  removalPolicy: cdk.RemovalPolicy;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  cognitoDomain: string;
  appSyncEndpoint: string;
  translationContentBucketName: string;
  readableContentBucketName: string;
  blueprintsBucketName: string;
}

export class WebConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: string;
  public readonly websiteBucket: s3.Bucket;
  public readonly logBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: WebConstructProps) {
    super(scope, id);

    const blueprintsBucketName = props.blueprintsBucketName;

    // Website origin bucket
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: props.removalPolicy,
      // autoDeleteObjects omitted — requires CDK bootstrap bucket which isn't available in StackSet-deployed accounts
    });

    // Logging bucket for CloudFront access logs
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: props.removalPolicy,
      // autoDeleteObjects omitted — requires CDK bootstrap bucket which isn't available in StackSet-deployed accounts
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
    });

    // CloudFront distribution with Origin Access Control
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      logBucket: this.logBucket,
      logFilePrefix: 'cloudfront/',
    });
    this.distributionDomainName = this.distribution.distributionDomainName;

    // Custom Resource Lambda — copies website from blueprints bucket and injects config
    const deployRole = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // S3 permissions: read from blueprints, read/write/delete to website bucket
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:ListBucket'],
      resources: [
        cdk.Fn.join('', ['arn:aws:s3:::', blueprintsBucketName]),
        cdk.Fn.join('', ['arn:aws:s3:::', blueprintsBucketName, '/*']),
      ],
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [
        this.websiteBucket.bucketArn,
        `${this.websiteBucket.bucketArn}/*`,
      ],
    }));
    // CloudFront invalidation
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        cdk.Fn.sub(
          'arn:aws:cloudfront::${AWS::AccountId}:distribution/${DistId}',
          { DistId: this.distribution.distributionId },
        ),
      ],
    }));

    const deployFn = new lambda.CfnFunction(this, 'DeployFn', {
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: deployRole.roleArn,
      timeout: 300,
      memorySize: 512,
      code: {
        zipFile: DEPLOY_LAMBDA_CODE,
      },
    });

    const deployCR = new cdk.CfnCustomResource(this, 'DeployCR', {
      serviceToken: cdk.Fn.getAtt(deployFn.logicalId, 'Arn').toString(),
    });
    deployCR.addPropertyOverride('SourceBucket', blueprintsBucketName);
    deployCR.addPropertyOverride('SourcePrefix', 'scenarios/simply-readable/website-build');
    deployCR.addPropertyOverride('DestBucket', this.websiteBucket.bucketName);
    deployCR.addPropertyOverride('DistributionId', this.distribution.distributionId);
    deployCR.addPropertyOverride('Region', cdk.Aws.REGION);
    deployCR.addPropertyOverride('UserPoolId', props.userPoolId);
    deployCR.addPropertyOverride('UserPoolClientId', props.userPoolClientId);
    deployCR.addPropertyOverride('IdentityPoolId', props.identityPoolId);
    deployCR.addPropertyOverride('CognitoDomain', props.cognitoDomain);
    deployCR.addPropertyOverride('AppSyncEndpoint', props.appSyncEndpoint);
    deployCR.addPropertyOverride('TranslationBucket', props.translationContentBucketName);
    deployCR.addPropertyOverride('ReadableBucket', props.readableContentBucketName);
    deployCR.addPropertyOverride('CloudFrontDomain', this.distribution.distributionDomainName);
    // Force update on each deployment
    deployCR.addPropertyOverride('Timestamp', Date.now().toString());
    // Ensure role policy is attached before Custom Resource invokes the Lambda
    deployCR.node.addDependency(deployRole);
  }
}

// Inline Custom Resource Lambda code (<4KB for ZipFile compatibility)
const DEPLOY_LAMBDA_CODE = `const{S3Client,ListObjectsV2Command,GetObjectCommand,PutObjectCommand}=require("@aws-sdk/client-s3");const{CloudFrontClient,CreateInvalidationCommand}=require("@aws-sdk/client-cloudfront");const https=require("https");
exports.handler=async(e,ctx)=>{const p=e.ResourceProperties;const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId||"deploy",StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId};
try{const s3=new S3Client();const cf=new CloudFrontClient();
if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}
let ct;do{const r=await s3.send(new ListObjectsV2Command({Bucket:p.SourceBucket,Prefix:p.SourcePrefix,ContinuationToken:ct}));if(r.Contents){for(const o of r.Contents){const k=o.Key.replace(p.SourcePrefix+"/","");const g=await s3.send(new GetObjectCommand({Bucket:p.SourceBucket,Key:o.Key}));const b=await g.Body.transformToByteArray();const mt=k.endsWith(".html")?"text/html":k.endsWith(".js")?"application/javascript":k.endsWith(".css")?"text/css":k.endsWith(".json")?"application/json":k.endsWith(".svg")?"image/svg+xml":"application/octet-stream";await s3.send(new PutObjectCommand({Bucket:p.DestBucket,Key:k,Body:b,ContentType:mt}))}}ct=r.NextContinuationToken}while(ct);
const cfg="window.__DOCTRAN_CONFIG__="+JSON.stringify({awsRegion:p.Region,awsUserPoolsId:p.UserPoolId,awsUserPoolsWebClientId:p.UserPoolClientId,awsCognitoIdentityPoolId:p.IdentityPoolId,awsCognitoOauthDomain:p.CognitoDomain,awsCognitoOauthRedirectSignIn:"https://"+p.CloudFrontDomain,awsCognitoOauthRedirectSignOut:"https://"+p.CloudFrontDomain,awsAppsyncGraphqlEndpoint:p.AppSyncEndpoint,awsUserFilesS3Bucket:p.TranslationBucket,awsTranslationFilesS3Bucket:p.TranslationBucket,awsReadableFilesS3Bucket:p.ReadableBucket,awsReadableS3Bucket:p.ReadableBucket})+";";
await s3.send(new PutObjectCommand({Bucket:p.DestBucket,Key:"config.js",Body:cfg,ContentType:"application/javascript",CacheControl:"no-cache"}));
await cf.send(new CreateInvalidationCommand({DistributionId:p.DistributionId,InvalidationBatch:{CallerReference:Date.now().toString(),Paths:{Quantity:1,Items:["/*"]}}}));
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;
