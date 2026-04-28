import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
}

interface AccessPointHandle {
  readonly id: string;
  readonly path: string;
}

/**
 * S3 Files file system backing the Paperless-ngx working set, plus the same
 * S3 bucket exposed as the source of truth for the archive (and the Bedrock
 * Knowledge Base data source). One bucket, both surfaces.
 */
export class StorageConstruct extends Construct {
  public readonly archiveBucket: s3.Bucket;
  public readonly fileSystemId: string;
  public readonly fileSystemArn: string;

  public readonly dataAccessPoint: AccessPointHandle;
  public readonly mediaAccessPoint: AccessPointHandle;
  public readonly consumeAccessPoint: AccessPointHandle;
  public readonly exportAccessPoint: AccessPointHandle;
  public readonly scriptsAccessPoint: AccessPointHandle;
  public readonly kbAccessPoint: AccessPointHandle;

  /** S3 prefix the post-consume hook writes OCR'd text to (KB ingests this). */
  public readonly kbPrefix = 'kb/';

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    // Source-of-truth bucket: holds Paperless's working set AND is the KB data source.
    // S3 Files requires versioning to be enabled and SSE-S3 or SSE-KMS encryption.
    this.archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: `ndx-try-paperless-archive-${accountId}-${region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // Empty-bucket on stack delete (no autoDeleteObjects — needs CDK bootstrap).
    const emptyRole = new iam.Role(this, 'EmptyBucketRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    emptyRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket', 's3:DeleteObject', 's3:ListBucketVersions', 's3:DeleteObjectVersion'],
      resources: [this.archiveBucket.bucketArn, `${this.archiveBucket.bucketArn}/*`],
    }));
    const emptyFn = new lambda.Function(this, 'EmptyBucketFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: emptyRole,
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(EMPTY_BUCKET_LAMBDA),
    });
    const cr = new cdk.CfnCustomResource(this, 'EmptyBucketCR', {
      serviceToken: emptyFn.functionArn,
    });
    cr.addPropertyOverride('BucketName', this.archiveBucket.bucketName);
    cr.node.addDependency(emptyRole);

    // IAM role assumed by the S3 Files service to sync the file system to the bucket.
    // S3 Files reuses the EFS service principal (elasticfilesystem.amazonaws.com).
    const syncRole = new iam.Role(this, 'SyncRole', {
      assumedBy: new iam.ServicePrincipal('elasticfilesystem.amazonaws.com', {
        conditions: {
          StringEquals: { 'aws:SourceAccount': accountId },
          ArnLike: { 'aws:SourceArn': `arn:aws:s3files:${region}:${accountId}:file-system/*` },
        },
      }),
      description: 'S3 Files file system sync role (assumed by EFS service)',
    });

    // Bucket-level read for sync.
    syncRole.addToPolicy(new iam.PolicyStatement({
      sid: 'S3BucketPermissions',
      actions: ['s3:ListBucket', 's3:ListBucketVersions'],
      resources: [this.archiveBucket.bucketArn],
      conditions: { StringEquals: { 'aws:ResourceAccount': accountId } },
    }));

    // Object-level read+write for sync.
    syncRole.addToPolicy(new iam.PolicyStatement({
      sid: 'S3ObjectPermissions',
      actions: [
        's3:AbortMultipartUpload',
        's3:DeleteObject',
        's3:DeleteObjectVersion',
        's3:GetObject',
        's3:GetObjectVersion',
        's3:GetObjectTagging',
        's3:GetObjectVersionTagging',
        's3:ListMultipartUploadParts',
        's3:PutObject',
        's3:PutObjectTagging',
      ],
      resources: [`${this.archiveBucket.bucketArn}/*`],
      conditions: { StringEquals: { 'aws:ResourceAccount': accountId } },
    }));

    // S3 Files manages an EventBridge rule named DO-NOT-DELETE-S3-Files-* to detect
    // bucket changes — needs perms to manage that rule.
    syncRole.addToPolicy(new iam.PolicyStatement({
      sid: 'EventBridgeManage',
      actions: [
        'events:DeleteRule',
        'events:DisableRule',
        'events:EnableRule',
        'events:PutRule',
        'events:PutTargets',
        'events:RemoveTargets',
      ],
      resources: ['arn:aws:events:*:*:rule/DO-NOT-DELETE-S3-Files*'],
      conditions: {
        StringEquals: { 'events:ManagedBy': 'elasticfilesystem.amazonaws.com' },
      },
    }));
    syncRole.addToPolicy(new iam.PolicyStatement({
      sid: 'EventBridgeRead',
      actions: [
        'events:DescribeRule',
        'events:ListRuleNamesByTarget',
        'events:ListRules',
        'events:ListTargetsByRule',
      ],
      resources: ['arn:aws:events:*:*:rule/*'],
    }));

    // The S3 Files file system itself.
    const fs = new cdk.CfnResource(this, 'FileSystem', {
      type: 'AWS::S3Files::FileSystem',
      properties: {
        AcceptBucketWarning: true,
        Bucket: this.archiveBucket.bucketArn,
        RoleArn: syncRole.roleArn,
      },
    });
    fs.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    fs.node.addDependency(syncRole);

    // FileSystem.Ref returns the ARN; FileSystemId attribute gives us the fs-xxx id directly.
    this.fileSystemArn = fs.ref;
    this.fileSystemId = fs.getAtt('FileSystemId').toString();

    // Mount targets — one per public subnet (2 AZs).
    props.vpc.publicSubnets.forEach((subnet, i) => {
      const mt = new cdk.CfnResource(this, `MountTarget${i}`, {
        type: 'AWS::S3Files::MountTarget',
        properties: {
          FileSystemId: fs.ref,
          SubnetId: subnet.subnetId,
          SecurityGroups: [props.securityGroup.securityGroupId],
        },
      });
      mt.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      mt.node.addDependency(fs);
    });

    const posixUser = { Uid: 1000, Gid: 1000 };
    const makeAccessPoint = (logicalId: string, path: string): AccessPointHandle => {
      const ap = new cdk.CfnResource(this, logicalId, {
        type: 'AWS::S3Files::AccessPoint',
        properties: {
          FileSystemId: fs.ref,
          PosixUser: posixUser,
          RootDirectory: {
            Path: path,
            CreationPermissions: {
              OwnerUid: 1000,
              OwnerGid: 1000,
              Permissions: '755',
            },
          },
        },
      });
      ap.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      ap.node.addDependency(fs);
      // S3 Files access point ARNs have the shape
      //   arn:aws:s3files:<region>:<acct>:file-system/<fs-id>/access-point/<fsap-id>
      // (i.e. nested under the file system). Ref on the AccessPoint resource
      // returns just the fsap-xxx id, so build the full ARN ourselves.
      const apArn = cdk.Fn.sub(
        'arn:aws:s3files:${AWS::Region}:${AWS::AccountId}:file-system/${FsId}/access-point/${ApId}',
        { FsId: this.fileSystemId, ApId: ap.ref },
      );
      return { id: apArn, path };
    };

    this.dataAccessPoint = makeAccessPoint('DataAp', '/data');
    this.mediaAccessPoint = makeAccessPoint('MediaAp', '/media');
    this.consumeAccessPoint = makeAccessPoint('ConsumeAp', '/consume');
    this.exportAccessPoint = makeAccessPoint('ExportAp', '/export');
    this.scriptsAccessPoint = makeAccessPoint('ScriptsAp', '/scripts');
    this.kbAccessPoint = makeAccessPoint('KbAp', '/kb');
  }
}

const EMPTY_BUCKET_LAMBDA = `const{S3Client,ListObjectVersionsCommand,DeleteObjectsCommand}=require("@aws-sdk/client-s3");const https=require("https");
exports.handler=async(e)=>{const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,Data:{}};
try{if(e.RequestType==="Delete"){const s3=new S3Client();const b=e.ResourceProperties.BucketName;let k;do{const r=await s3.send(new ListObjectVersionsCommand({Bucket:b,KeyMarker:k}));const objs=[...(r.Versions||[]).map(v=>({Key:v.Key,VersionId:v.VersionId})),...(r.DeleteMarkers||[]).map(v=>({Key:v.Key,VersionId:v.VersionId}))];if(objs.length>0){for(let i=0;i<objs.length;i+=1000){await s3.send(new DeleteObjectsCommand({Bucket:b,Delete:{Objects:objs.slice(i,i+1000),Quiet:true}}))}}k=r.IsTruncated?r.NextKeyMarker:undefined}while(k)}
await send(e.ResponseURL,rp)}catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}};
function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}`;
