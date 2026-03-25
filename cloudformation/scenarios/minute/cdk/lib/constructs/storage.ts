import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StorageConstructProps {}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, _props?: StorageConstructProps) {
    super(scope, id);

    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // Will be restricted once we have a domain
          allowedHeaders: ['*'],
        },
      ],
    });

    // Allow AWS Transcribe to read/write audio files
    this.dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('transcribe.amazonaws.com')],
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
      }),
    );
  }
}
