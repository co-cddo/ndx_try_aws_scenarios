import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  aws_appsync as appsync,
  aws_pipes as pipes,
} from 'aws-cdk-lib';

export interface TranslationConstructProps {
  removalPolicy: cdk.RemovalPolicy;
  apiId: string;
  authenticatedRole: iam.Role;
  blueprintsBucketName: string;
}

export class TranslationConstruct extends Construct {
  public readonly contentBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: TranslationConstructProps) {
    super(scope, id);

    const blueprintsBucket = props.blueprintsBucketName;

    // Content bucket for uploaded documents and translations
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: props.removalPolicy,
      // autoDeleteObjects omitted — requires CDK bootstrap which isn't available in StackSet-deployed accounts
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag'],
      }],
      lifecycleRules: [{
        expiration: cdk.Duration.days(7),
        prefix: 'private/',
      }],
    });

    // Grant authenticated users identity-scoped S3 access
    props.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [`${this.contentBucket.bucketArn}/private/\${cognito-identity.amazonaws.com:sub}/*`],
    }));
    props.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [this.contentBucket.bucketArn],
      conditions: {
        StringLike: {
          's3:prefix': ['private/${cognito-identity.amazonaws.com:sub}/*'],
        },
      },
    }));

    // Grant authenticated users access to AWS Translate and Comprehend for in-browser translation
    props.authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText', 'translate:TranslateDocument', 'translate:ListTerminologies', 'comprehend:DetectDominantLanguage'],
      resources: ['*'],
    }));

    // DynamoDB table for translation jobs
    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'jobOwner', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: props.removalPolicy,
    });
    jobsTable.addGlobalSecondaryIndex({
      indexName: 'byOwnerAndCreatedAt',
      partitionKey: { name: 'jobOwner', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
    });

    // AppSync data source for DynamoDB
    const dsRole = new iam.Role(this, 'AppSyncDSRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });
    jobsTable.grantReadWriteData(dsRole);

    const dataSource = new appsync.CfnDataSource(this, 'JobsDataSource', {
      apiId: props.apiId,
      name: 'TranslationJobsTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: {
        tableName: jobsTable.tableName,
        awsRegion: cdk.Aws.REGION,
      },
      serviceRoleArn: dsRole.roleArn,
    });

    // Resolver: translationListJobs
    new appsync.CfnResolver(this, 'ListJobsResolver', {
      apiId: props.apiId,
      typeName: 'Query',
      fieldName: 'translationListJobs',
      dataSourceName: dataSource.attrName,
      requestMappingTemplate: `{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "byOwnerAndCreatedAt",
  "query": {
    "expression": "jobOwner = :owner",
    "expressionValues": { ":owner": $util.dynamodb.toDynamoDBJson($ctx.identity.sub) }
  },
  "scanIndexForward": false,
  "limit": $util.defaultIfNull($ctx.args.limit, 20),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null))
}`,
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });

    // Resolver: translationCreateJob
    // The React app sends { input: { jobIdentity, id, jobName, languageSource, languageTargets, ... } }
    // DDB key uses jobOwner (sort key + GSI partition key), set from the authenticated user's sub.
    new appsync.CfnResolver(this, 'CreateJobResolver', {
      apiId: props.apiId,
      typeName: 'Mutation',
      fieldName: 'translationCreateJob',
      dataSourceName: dataSource.attrName,
      requestMappingTemplate: [
        '#set($input = $ctx.args.input)',
        '#set($input.jobOwner = $ctx.identity.sub)',
        '#if(!$input.createdAt)',
        '  #set($input.createdAt = $util.time.nowEpochSeconds())',
        '#end',
        '{',
        '  "version": "2017-02-28",',
        '  "operation": "PutItem",',
        '  "key": {',
        '    "id": $util.dynamodb.toDynamoDBJson($input.id),',
        '    "jobOwner": $util.dynamodb.toDynamoDBJson($input.jobOwner)',
        '  },',
        '  "attributeValues": $util.dynamodb.toMapValuesJson($input)',
        '}',
      ].join('\n'),
      responseMappingTemplate: `$util.toJson($ctx.result)`,
    });

    // Lambda helper function for DDB unmarshalling (used in Step Functions)
    const unmarshallFn = this.createLambda('UnmarshallDdb', 'unmarshallDdb', blueprintsBucket, props.removalPolicy);
    const decodeS3KeyFn = this.createLambda('DecodeS3Key', 'decodeS3Key', blueprintsBucket, props.removalPolicy);
    const regexReplaceFn = this.createLambda('RegexReplace', 'utilRegexReplace', blueprintsBucket, props.removalPolicy);
    const trimFn = this.createLambda('Trim', 'utilTrim', blueprintsBucket, props.removalPolicy);
    const splitFn = this.createLambda('Split', 'utilSplit', blueprintsBucket, props.removalPolicy);
    const parseTerminologiesFn = this.createLambda('ParseTerminologies', 'parseTerminologies', blueprintsBucket, props.removalPolicy);

    // IAM role for AWS Translate service to access S3
    const translateRole = new iam.Role(this, 'TranslateRole', {
      assumedBy: new iam.ServicePrincipal('translate.amazonaws.com'),
    });
    translateRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${this.contentBucket.bucketArn}/*`],
    }));
    translateRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${this.contentBucket.bucketArn}/*`],
    }));
    translateRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [this.contentBucket.bucketArn],
    }));

    // Step Functions execution role
    const sfnRole = new iam.Role(this, 'SfnRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['translate:TranslateText', 'translate:StartTextTranslationJob', 'translate:DescribeTextTranslationJob', 'translate:ListTerminologies'],
      resources: ['*'],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [translateRole.roleArn],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
      resources: [this.contentBucket.bucketArn, `${this.contentBucket.bucketArn}/*`],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
      resources: [jobsTable.tableArn, `${jobsTable.tableArn}/index/*`],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        unmarshallFn.functionArn, decodeS3KeyFn.functionArn,
        regexReplaceFn.functionArn, trimFn.functionArn,
        splitFn.functionArn, parseTerminologiesFn.functionArn,
      ],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['events:PutTargets', 'events:PutRule', 'events:DescribeRule'],
      resources: [`arn:aws:events:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:rule/*`],
    }));

    // Main Translation State Machine (simplified — core orchestration)
    const mainSfn = new sfn.CfnStateMachine(this, 'MainStateMachine', {
      roleArn: sfnRole.roleArn,
      definitionString: JSON.stringify({
        Comment: 'Simply Readable Translation Main Orchestrator',
        StartAt: 'ExtractEvent',
        States: {
          ExtractEvent: {
            Type: 'Pass',
            Parameters: {
              'id.$': '$[0].dynamodb.NewImage.id.S',
              'jobOwner.$': '$[0].dynamodb.NewImage.jobOwner.S',
              'languageSource.$': '$[0].dynamodb.NewImage.languageSource.S',
              'contentType.$': '$[0].dynamodb.NewImage.contentType.S',
              'jobIdentity.$': '$[0].dynamodb.NewImage.jobIdentity.S',
              'jobName.$': '$[0].dynamodb.NewImage.jobName.S',
              'languageTargets.$': '$[0].dynamodb.NewImage.languageTargets.S',
            },
            Next: 'ParseTargets',
          },
          ParseTargets: {
            Type: 'Pass',
            Parameters: {
              'id.$': '$.id',
              'jobOwner.$': '$.jobOwner',
              'languageSource.$': '$.languageSource',
              'contentType.$': '$.contentType',
              'jobIdentity.$': '$.jobIdentity',
              'jobName.$': '$.jobName',
              'targetLanguageCodes.$': 'States.StringToJson($.languageTargets)',
            },
            Next: 'UpdateStatus_Processing',
          },
          UpdateStatus_Processing: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: { 'id': { 'S.$': '$.id' }, 'jobOwner': { 'S.$': '$.jobOwner' } },
              UpdateExpression: 'SET jobStatus = :s',
              ExpressionAttributeValues: { ':s': { 'S': 'PROCESSING' } },
            },
            ResultPath: null,
            Next: 'StartTranslationJob',
          },
          StartTranslationJob: {
            Type: 'Task',
            Resource: 'arn:aws:states:::aws-sdk:translate:startTextTranslationJob',
            Parameters: {
              'ClientToken.$': '$.id',
              DataAccessRoleArn: translateRole.roleArn,
              'JobName.$': '$.id',
              InputDataConfig: {
                'ContentType.$': '$.contentType',
                'S3Uri.$': `States.Format('s3://${this.contentBucket.bucketName}/private/{}/{}/upload/', $.jobIdentity, $.id)`,
              },
              OutputDataConfig: {
                'S3Uri.$': `States.Format('s3://${this.contentBucket.bucketName}/private/{}/{}/output/', $.jobIdentity, $.id)`,
              },
              'SourceLanguageCode.$': '$.languageSource',
              'TargetLanguageCodes.$': '$.targetLanguageCodes',
            },
            ResultPath: '$.translationJob',
            Next: 'WaitForTranslation',
            Catch: [{
              ErrorEquals: ['States.ALL'],
              ResultPath: '$.error',
              Next: 'UpdateStatus_Error',
            }],
          },
          WaitForTranslation: {
            Type: 'Wait',
            Seconds: 30,
            Next: 'CheckTranslationStatus',
          },
          CheckTranslationStatus: {
            Type: 'Task',
            Resource: 'arn:aws:states:::aws-sdk:translate:describeTextTranslationJob',
            Parameters: {
              'JobId.$': '$.translationJob.JobId',
            },
            ResultPath: '$.translationStatus',
            Next: 'IsTranslationComplete',
            Catch: [{
              ErrorEquals: ['States.ALL'],
              ResultPath: '$.error',
              Next: 'UpdateStatus_Error',
            }],
          },
          IsTranslationComplete: {
            Type: 'Choice',
            Choices: [
              {
                Variable: '$.translationStatus.TextTranslationJobProperties.JobStatus',
                StringEquals: 'COMPLETED',
                Next: 'UpdateStatus_Completed',
              },
              {
                Variable: '$.translationStatus.TextTranslationJobProperties.JobStatus',
                StringEquals: 'FAILED',
                Next: 'UpdateStatus_Error',
              },
              {
                Variable: '$.translationStatus.TextTranslationJobProperties.JobStatus',
                StringEquals: 'COMPLETED_WITH_ERROR',
                Next: 'UpdateStatus_Error',
              },
            ],
            Default: 'WaitForTranslation',
          },
          UpdateStatus_Completed: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: { 'id': { 'S.$': '$.id' }, 'jobOwner': { 'S.$': '$.jobOwner' } },
              UpdateExpression: 'SET jobStatus = :s',
              ExpressionAttributeValues: { ':s': { 'S': 'COMPLETED' } },
            },
            End: true,
          },
          UpdateStatus_Error: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: { 'id': { 'S.$': '$.id' }, 'jobOwner': { 'S.$': '$.jobOwner' } },
              UpdateExpression: 'SET jobStatus = :s',
              ExpressionAttributeValues: { ':s': { 'S': 'ERROR' } },
            },
            End: true,
          },
        },
      }),
    });

    // EventBridge Pipe: DDB Stream → Step Functions (trigger on UPLOADED status)
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });
    pipeRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
      resources: [jobsTable.tableStreamArn!],
    }));
    pipeRole.addToPolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [mainSfn.attrArn],
    }));

    new pipes.CfnPipe(this, 'TranslationPipe', {
      roleArn: pipeRole.roleArn,
      source: jobsTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
        },
        filterCriteria: {
          filters: [{
            pattern: JSON.stringify({
              eventName: ['INSERT', 'MODIFY'],
              dynamodb: {
                NewImage: {
                  jobStatus: { S: ['UPLOADED'] },
                },
              },
            }),
          }],
        },
      },
      target: mainSfn.attrArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
    });
  }

  private createLambda(
    constructId: string,
    functionName: string,
    blueprintsBucket: string,
    removalPolicy: cdk.RemovalPolicy,
  ): lambda.Function {
    const role = new iam.Role(this, `${constructId}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    const fn = new lambda.Function(this, constructId, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(this, `${constructId}Bucket`, blueprintsBucket),
        `scenarios/simply-readable/lambda/${functionName}.zip`,
      ),
      role,
      timeout: cdk.Duration.seconds(60),
      memorySize: 128,
      architecture: lambda.Architecture.ARM_64,
    });

    return fn;
  }
}
