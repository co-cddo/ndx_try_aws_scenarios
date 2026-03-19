import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, _props?: StorageConstructProps) {
    super(scope, id);

    // S3 bucket for Active Storage uploads
    this.bucket = new s3.Bucket(this, 'UploadsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Empty-bucket custom resource for clean stack deletion
    // Cannot use autoDeleteObjects — it requires CDK bootstrap (CDKToolkit stack)
    // which ISB sandbox accounts do not have
    const emptyBucketRole = new iam.Role(this, 'EmptyBucketRole', {
      roleName: 'InnovationSandbox-ndx-bops-empty-bucket',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    emptyBucketRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:ListBucket',
          's3:DeleteObject',
          's3:ListBucketVersions',
          's3:DeleteObjectVersion',
        ],
        resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
      }),
    );

    const emptyBucketFn = new lambda.Function(this, 'EmptyBucketFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: emptyBucketRole,
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(EMPTY_BUCKET_LAMBDA_CODE),
    });

    const cr = new cdk.CfnCustomResource(this, 'EmptyBucketCR', {
      serviceToken: emptyBucketFn.functionArn,
    });
    cr.addPropertyOverride('BucketName', this.bucket.bucketName);
    cr.node.addDependency(emptyBucketRole);
  }
}

// Empty bucket Lambda — clears all objects/versions on stack deletion
const EMPTY_BUCKET_LAMBDA_CODE = `const{S3Client,ListObjectVersionsCommand,DeleteObjectsCommand}=require("@aws-sdk/client-s3");const https=require("https");
exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
try{if(e.RequestType==="Delete"){const s3=new S3Client();const b=e.ResourceProperties.BucketName;let k;do{const r=await s3.send(new ListObjectVersionsCommand({Bucket:b,KeyMarker:k}));const objs=[...(r.Versions||[]).map(v=>({Key:v.Key,VersionId:v.VersionId})),...(r.DeleteMarkers||[]).map(v=>({Key:v.Key,VersionId:v.VersionId}))];if(objs.length>0){for(let i=0;i<objs.length;i+=1000){await s3.send(new DeleteObjectsCommand({Bucket:b,Delete:{Objects:objs.slice(i,i+1000),Quiet:true}}))}}k=r.IsTruncated?r.NextKeyMarker:undefined}while(k)}
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;
