import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_stepfunctions as sfn,
  aws_appsync as appsync,
  aws_pipes as pipes,
} from 'aws-cdk-lib';

export interface ReadableConstructProps {
  removalPolicy: cdk.RemovalPolicy;
  apiId: string;
  appSyncEndpoint: string;
  authenticatedRole: iam.Role;
  blueprintsBucketName: string;
}

export class ReadableConstruct extends Construct {
  public readonly contentBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ReadableConstructProps) {
    super(scope, id);

    const blueprintsBucket = props.blueprintsBucketName;
    const bedrockRegion = 'us-east-1';

    // Content bucket for readable outputs
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

    // DynamoDB job table
    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: props.removalPolicy,
    });

    // DynamoDB model table (stores available Bedrock models)
    const modelTable = new dynamodb.Table(this, 'ModelTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy,
    });

    // DynamoDB print styles table
    const printStyleTable = new dynamodb.Table(this, 'PrintStyleTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy,
    });

    // Seed models table with available Bedrock models (Custom Resource)
    const seedRole = new iam.Role(this, 'SeedRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    modelTable.grantWriteData(seedRole);
    printStyleTable.grantWriteData(seedRole);
    seedRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:ListFoundationModelAgreementOffers',
        'bedrock:CreateFoundationModelAgreement',
        'bedrock:GetFoundationModelAvailability',
      ],
      resources: ['*'],
    }));
    seedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['aws-marketplace:Subscribe', 'aws-marketplace:Unsubscribe', 'aws-marketplace:ViewSubscriptions'],
      resources: ['*'],
    }));

    const seedFn = new lambda.CfnFunction(this, 'SeedFn', {
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: seedRole.roleArn,
      timeout: 60,
      code: {
        zipFile: SEED_LAMBDA_CODE,
      },
    });

    const seedCR = new cdk.CfnCustomResource(this, 'SeedCR', {
      serviceToken: cdk.Fn.getAtt(seedFn.logicalId, 'Arn').toString(),
    });
    seedCR.addPropertyOverride('ModelTableName', modelTable.tableName);
    seedCR.addPropertyOverride('PrintStyleTableName', printStyleTable.tableName);
    // Ensure role policy is attached before Custom Resource invokes the Lambda
    seedCR.node.addDependency(seedRole);

    // AppSync data sources and resolvers
    const dsRole = new iam.Role(this, 'AppSyncDSRole', {
      assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
    });
    jobsTable.grantReadWriteData(dsRole);
    modelTable.grantReadData(dsRole);
    printStyleTable.grantReadData(dsRole);

    const jobsDS = new appsync.CfnDataSource(this, 'JobsDataSource', {
      apiId: props.apiId,
      name: 'ReadableJobsTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: { tableName: jobsTable.tableName, awsRegion: cdk.Aws.REGION },
      serviceRoleArn: dsRole.roleArn,
    });

    const modelDS = new appsync.CfnDataSource(this, 'ModelDataSource', {
      apiId: props.apiId,
      name: 'ReadableModelTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: { tableName: modelTable.tableName, awsRegion: cdk.Aws.REGION },
      serviceRoleArn: dsRole.roleArn,
    });

    const printStyleDS = new appsync.CfnDataSource(this, 'PrintStyleDataSource', {
      apiId: props.apiId,
      name: 'ReadablePrintStyleTable',
      type: 'AMAZON_DYNAMODB',
      dynamoDbConfig: { tableName: printStyleTable.tableName, awsRegion: cdk.Aws.REGION },
      serviceRoleArn: dsRole.roleArn,
    });

    // Resolvers for readable queries/mutations
    this.createResolver(props.apiId, 'Query', 'readableListJobs', jobsDS.attrName,
      `{"version":"2017-02-28","operation":"Scan","limit":$util.defaultIfNull($ctx.args.limit,20),"nextToken":$util.toJson($util.defaultIfNull($ctx.args.nextToken,null))}`,
      `$util.toJson($ctx.result)`);

    // Pipeline resolver: GetItem for metadata + Query for items.
    // DDB Query has a 1MB page limit. The metadata item (sort key "metadata")
    // sorts after UUID-based itemIds, so it can be on an unpaginated page.
    // Fetching it via GetItem first guarantees it's always present.
    const getMetadataFn = new appsync.CfnFunctionConfiguration(this, 'GetMetadataFn', {
      apiId: props.apiId,
      name: 'ReadableGetMetadata',
      dataSourceName: jobsDS.attrName,
      runtime: { name: 'APPSYNC_JS', runtimeVersion: '1.0.0' },
      code: [
        'export function request(ctx) {',
        '  return {',
        '    operation: "GetItem",',
        '    key: util.dynamodb.toMapValues({ id: ctx.args.id, itemId: "metadata" }),',
        '  };',
        '}',
        'export function response(ctx) {',
        '  ctx.stash.metadata = ctx.result;',
        '  return ctx.result;',
        '}',
      ].join('\n'),
    });

    const queryItemsFn = new appsync.CfnFunctionConfiguration(this, 'QueryItemsFn', {
      apiId: props.apiId,
      name: 'ReadableQueryItems',
      dataSourceName: jobsDS.attrName,
      runtime: { name: 'APPSYNC_JS', runtimeVersion: '1.0.0' },
      code: [
        'export function request(ctx) {',
        '  return {',
        '    operation: "Query",',
        '    query: {',
        '      expression: "id = :id",',
        '      expressionValues: util.dynamodb.toMapValues({ ":id": ctx.args.id }),',
        '    },',
        '  };',
        '}',
        'export function response(ctx) {',
        '  return ctx.result;',
        '}',
      ].join('\n'),
    });

    new appsync.CfnResolver(this, 'QueryreadableGetJobResolver', {
      apiId: props.apiId,
      typeName: 'Query',
      fieldName: 'readableGetJob',
      kind: 'PIPELINE',
      pipelineConfig: {
        functions: [getMetadataFn.attrFunctionId, queryItemsFn.attrFunctionId],
      },
      runtime: { name: 'APPSYNC_JS', runtimeVersion: '1.0.0' },
      code: [
        'export function request(ctx) { return {}; }',
        'export function response(ctx) {',
        '  const items = ctx.prev.result.items || [];',
        '  const hasMetadata = items.some(i => i.itemId === "metadata");',
        '  if (!hasMetadata && ctx.stash.metadata) {',
        '    items.unshift(ctx.stash.metadata);',
        '  }',
        '  return { items };',
        '}',
      ].join('\n'),
    });

    this.createResolver(props.apiId, 'Query', 'readableListModels', modelDS.attrName,
      `{"version":"2017-02-28","operation":"Scan","limit":$util.defaultIfNull($ctx.args.limit,50)}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Query', 'readableListPrintStyles', printStyleDS.attrName,
      `{"version":"2017-02-28","operation":"Scan","limit":$util.defaultIfNull($ctx.args.limit,50)}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Mutation', 'readableCreateJob', jobsDS.attrName,
      `{"version":"2017-02-28","operation":"PutItem","key":{"id":$util.dynamodb.toDynamoDBJson($util.autoId()),"itemId":{"S":"metadata"}},"attributeValues":{"identity":$util.dynamodb.toDynamoDBJson($ctx.args.identity),"createdAt":$util.dynamodb.toDynamoDBJson($util.time.nowEpochSeconds()),"updatedAt":$util.dynamodb.toDynamoDBJson($util.time.nowEpochSeconds())}}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Mutation', 'readableUpdateJobMetadata', jobsDS.attrName,
      `{"version":"2017-02-28","operation":"UpdateItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.args.id),"itemId":{"S":"metadata"}},"update":{"expression":"SET #n = :n, updatedAt = :u","expressionNames":{"#n":"name"},"expressionValues":{":n":$util.dynamodb.toDynamoDBJson($ctx.args.name),":u":$util.dynamodb.toDynamoDBJson($util.time.nowEpochSeconds())}}}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Mutation', 'readableCreateJobItem', jobsDS.attrName,
      `{"version":"2017-02-28","operation":"PutItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.args.id),"itemId":$util.dynamodb.toDynamoDBJson($util.autoId())},"attributeValues":{"order":$util.dynamodb.toDynamoDBJson($ctx.args.order),"identity":$util.dynamodb.toDynamoDBJson($ctx.args.identity),"type":$util.dynamodb.toDynamoDBJson($ctx.args.type),"parent":$util.dynamodb.toDynamoDBJson($ctx.args.parent),"input":$util.dynamodb.toDynamoDBJson($ctx.args.input),"modelId":$util.dynamodb.toDynamoDBJson($ctx.args.modelId),"output":$util.dynamodb.toDynamoDBJson($ctx.args.output),"owner":$util.dynamodb.toDynamoDBJson($ctx.args.owner),"status":$util.dynamodb.toDynamoDBJson($ctx.args.status)}}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Mutation', 'readableUpdateJobItem', jobsDS.attrName,
      [
        '#set($exp = "SET ")',
        '#set($expNames = {})',
        '#set($expValues = {})',
        '#set($sep = "")',
        '#foreach($field in [["type","#t",":t"],["order","#o",":o"],["status","#s",":s"],["output","#out",":out"],["modelId","modelId",":m"],["input","#inp",":inp"],["parent","parent",":p"],["identity","identity",":id"],["owner","owner",":ow"]])',
        '  #set($key = $field[0])',
        '  #if(!$util.isNull($ctx.args[$key]))',
        '    #set($exp = "${exp}${sep}$field[1] = $field[2]")',
        '    #if($field[1].startsWith("#"))',
        '      $util.qr($expNames.put($field[1], $key))',
        '    #end',
        '    $util.qr($expValues.put($field[2], $util.dynamodb.toDynamoDB($ctx.args[$key])))',
        '    #set($sep = ", ")',
        '  #end',
        '#end',
        '#if($sep == "")',
        '  {"version":"2017-02-28","operation":"GetItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.args.id),"itemId":$util.dynamodb.toDynamoDBJson($ctx.args.itemId)}}',
        '#else',
        '  {"version":"2017-02-28","operation":"UpdateItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.args.id),"itemId":$util.dynamodb.toDynamoDBJson($ctx.args.itemId)},"update":{"expression":"$exp","expressionNames":$util.toJson($expNames),"expressionValues":$util.toJson($expValues)}}',
        '#end',
      ].join('\n'),
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Mutation', 'readableCreateJobImport', jobsDS.attrName,
      `{"version":"2017-02-28","operation":"PutItem","key":{"id":$util.dynamodb.toDynamoDBJson($ctx.args.id),"itemId":$util.dynamodb.toDynamoDBJson($util.autoId())},"attributeValues":{"identity":$util.dynamodb.toDynamoDBJson($ctx.args.identity),"order":$util.dynamodb.toDynamoDBJson($ctx.args.order),"type":$util.dynamodb.toDynamoDBJson($ctx.args.type),"modelId":$util.dynamodb.toDynamoDBJson($ctx.args.modelId),"status":$util.dynamodb.toDynamoDBJson($ctx.args.status),"key":$util.dynamodb.toDynamoDBJson($ctx.args.key)}}`,
      `$util.toJson($ctx.result)`);

    // Lambda functions for readable processing
    const invokeBedrock = this.createLambda('InvokeBedrock', 'invokeBedrock', blueprintsBucket, props.removalPolicy, {
      BEDROCK_REGION: bedrockRegion,
    });
    const invokeBedrockSaveToS3 = this.createLambda('InvokeBedrockSaveToS3', 'invokeBedrockSaveToS3', blueprintsBucket, props.removalPolicy, {
      BEDROCK_REGION: bedrockRegion,
    });
    const docToHtml = this.createLambda('DocToHtml', 'docToHtml', blueprintsBucket, props.removalPolicy, {
      BUCKET_NAME: this.contentBucket.bucketName,
    });
    const htmlToMd = this.createLambda('HtmlToMd', 'htmlToMd', blueprintsBucket, props.removalPolicy, {
      BUCKET_NAME: this.contentBucket.bucketName,
    });
    const unmarshallDdb = this.createLambda('UnmarshallDdb', 'unmarshallDdb', blueprintsBucket, props.removalPolicy);
    const utilSplit = this.createLambda('UtilSplit', 'utilSplit', blueprintsBucket, props.removalPolicy, {
      BUCKET_NAME: this.contentBucket.bucketName,
      TABLE_NAME: jobsTable.tableName,
    });
    const appsyncMutation = this.createLambda('AppsyncMutation', 'appsyncMutationRequest', blueprintsBucket, props.removalPolicy, {
      API_ENDPOINT: props.appSyncEndpoint,
      API_REGION: cdk.Aws.REGION,
    });

    // IAM for Bedrock Lambda functions
    invokeBedrock.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${bedrockRegion}::foundation-model/*`,
        `arn:aws:bedrock:${bedrockRegion}:${cdk.Aws.ACCOUNT_ID}:custom-model/*`,
      ],
    }));
    invokeBedrockSaveToS3.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${bedrockRegion}::foundation-model/*`,
        `arn:aws:bedrock:${bedrockRegion}:${cdk.Aws.ACCOUNT_ID}:custom-model/*`,
      ],
    }));
    invokeBedrockSaveToS3.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${this.contentBucket.bucketArn}/private/*`],
    }));

    // IAM for doc processing Lambda functions
    docToHtml.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
      resources: [this.contentBucket.bucketArn, `${this.contentBucket.bucketArn}/*`],
    }));
    htmlToMd.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${this.contentBucket.bucketArn}/*`],
    }));
    utilSplit.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${this.contentBucket.bucketArn}/*`],
    }));
    utilSplit.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:BatchWriteItem'],
      resources: [jobsTable.tableArn],
    }));

    // IAM for AppSync mutation Lambda
    appsyncMutation.addToRolePolicy(new iam.PolicyStatement({
      actions: ['appsync:GraphQL'],
      resources: [`arn:aws:appsync:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:apis/${props.apiId}/*`],
    }));

    // Step Functions execution role for readable
    const sfnRole = new iam.Role(this, 'SfnRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        invokeBedrock.functionArn, invokeBedrockSaveToS3.functionArn,
        docToHtml.functionArn, htmlToMd.functionArn,
        unmarshallDdb.functionArn, appsyncMutation.functionArn,
        utilSplit.functionArn,
      ],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
      resources: [jobsTable.tableArn, modelTable.tableArn],
    }));
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:${bedrockRegion}::foundation-model/*`],
    }));
    // Readable Generate State Machine
    const generateSfn = new sfn.CfnStateMachine(this, 'GenerateStateMachine', {
      roleArn: sfnRole.roleArn,
      definitionString: JSON.stringify({
        Comment: 'Simply Readable Generate — Bedrock text simplification and image generation',
        StartAt: 'ExtractNewImage',
        States: {
          ExtractNewImage: {
            Type: 'Pass',
            Parameters: {
              'newImage.$': '$[0].dynamodb.NewImage',
            },
            Next: 'UnmarshallEvent',
          },
          UnmarshallEvent: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: unmarshallDdb.functionArn,
              'Payload.$': '$.newImage',
            },
            ResultPath: '$.unmarshalled',
            ResultSelector: { 'Payload.$': '$.Payload' },
            Next: 'GetModelConfig',
          },
          GetModelConfig: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:getItem',
            Parameters: {
              TableName: modelTable.tableName,
              Key: { 'id': { 'S.$': '$.unmarshalled.Payload.modelId' } },
            },
            ResultPath: '$.modelConfig',
            Next: 'RouteByModelType',
          },
          RouteByModelType: {
            Type: 'Choice',
            Choices: [
              {
                Variable: '$.modelConfig.Item.type.S',
                StringEquals: 'image',
                Next: 'InvokeBedrockImage',
              },
            ],
            Default: 'PrepareTextPrompt',
          },
          PrepareTextPrompt: {
            Type: 'Pass',
            Parameters: {
              'prompt.$': "States.Format('Rewrite the following complex text in plain, simple English that is easy to read and understand. Use short sentences, simple words, and active voice. Keep the same meaning but make it accessible to a wide audience. Do not add any introduction or explanation, just provide the simplified text. TEXT: {}', $.unmarshalled.Payload.input)",
              'modelId.$': '$.unmarshalled.Payload.modelId',
              'id.$': '$.unmarshalled.Payload.id',
              'itemId.$': '$.unmarshalled.Payload.itemId',
            },
            Next: 'InvokeBedrockText',
          },
          InvokeBedrockText: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: invokeBedrock.functionArn,
              Payload: {
                'ModelId.$': '$.modelId',
                Body: {
                  anthropic_version: 'bedrock-2023-05-31',
                  max_tokens: 2048,
                  messages: [{
                    role: 'user',
                    content: [{ type: 'text', 'text.$': '$.prompt' }],
                  }],
                },
              },
            },
            ResultPath: '$.bedrockResult',
            ResultSelector: { 'Payload.$': '$.Payload' },
            Next: 'ExtractTextResponse',
          },
          ExtractTextResponse: {
            Type: 'Pass',
            Parameters: {
              'simplifiedText.$': '$.bedrockResult.Payload.Body.content[0].text',
              'id.$': '$.id',
              'itemId.$': '$.itemId',
            },
            Next: 'UpdateJobItem',
          },
          InvokeBedrockImage: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: invokeBedrockSaveToS3.functionArn,
              Payload: {
                'ModelId.$': '$.unmarshalled.Payload.modelId',
                Body: {
                  taskType: 'TEXT_IMAGE',
                  textToImageParams: {
                    'text.$': '$.unmarshalled.Payload.input',
                  },
                  imageGenerationConfig: {
                    numberOfImages: 1,
                    quality: 'standard',
                    height: 512,
                    width: 512,
                  },
                },
                ResultS3Bucket: this.contentBucket.bucketName,
                'ResultS3Key.$': "States.Format('private/{}/{}/images/{}.png', $.unmarshalled.Payload.identity, $.unmarshalled.Payload.id, $.unmarshalled.Payload.itemId)",
                PathToResult: 'images.0',
              },
            },
            ResultPath: '$.bedrockResult',
            ResultSelector: { 'Payload.$': '$.Payload' },
            Next: 'UpdateJobItemImage',
          },
          UpdateJobItemImage: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: {
                'id': { 'S.$': '$.unmarshalled.Payload.id' },
                'itemId': { 'S.$': '$.unmarshalled.Payload.itemId' },
              },
              UpdateExpression: 'SET #s = :s, #o = :o',
              ExpressionAttributeNames: { '#s': 'status', '#o': 'output' },
              ExpressionAttributeValues: {
                ':s': { 'S': 'completed' },
                ':o': { 'S.$': '$.bedrockResult.Payload.key' },
              },
            },
            End: true,
          },
          UpdateJobItem: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: {
                'id': { 'S.$': '$.id' },
                'itemId': { 'S.$': '$.itemId' },
              },
              UpdateExpression: 'SET #s = :s, #o = :o',
              ExpressionAttributeNames: { '#s': 'status', '#o': 'output' },
              ExpressionAttributeValues: {
                ':s': { 'S': 'completed' },
                ':o': { 'S.$': '$.simplifiedText' },
              },
            },
            End: true,
          },
        },
      }),
    });

    // Readable ParseDoc State Machine
    const parseDocSfn = new sfn.CfnStateMachine(this, 'ParseDocStateMachine', {
      roleArn: sfnRole.roleArn,
      definitionString: JSON.stringify({
        Comment: 'Simply Readable ParseDoc — Extract text from uploaded .docx, split into paragraphs, and create job items',
        StartAt: 'ExtractNewImage',
        States: {
          ExtractNewImage: {
            Type: 'Pass',
            Parameters: {
              'id.$': '$[0].dynamodb.NewImage.id.S',
              'itemId.$': '$[0].dynamodb.NewImage.itemId.S',
              'key.$': '$[0].dynamodb.NewImage.key.S',
              'identity.$': '$[0].dynamodb.NewImage.identity.S',
              'modelId.$': '$[0].dynamodb.NewImage.modelId.S',
            },
            Next: 'DocToHtml',
          },
          DocToHtml: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: docToHtml.functionArn,
              Payload: { 'key.$': '$.key' },
            },
            ResultPath: '$.docToHtmlResult',
            ResultSelector: { 'htmlKey.$': '$.Payload.htmlKey' },
            Next: 'HtmlToMd',
          },
          HtmlToMd: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: htmlToMd.functionArn,
              Payload: { 'htmlKey.$': '$.docToHtmlResult.htmlKey' },
            },
            ResultPath: '$.htmlToMdResult',
            ResultSelector: { 'mdKey.$': '$.Payload.mdKey' },
            Next: 'SplitParagraphs',
          },
          SplitParagraphs: {
            Type: 'Task',
            Resource: 'arn:aws:states:::lambda:invoke',
            Parameters: {
              FunctionName: utilSplit.functionArn,
              Payload: {
                'mdKey.$': '$.htmlToMdResult.mdKey',
                splitter: '\n\n',
                'id.$': '$.id',
                'identity.$': '$.identity',
                'modelId.$': '$.modelId',
              },
            },
            ResultPath: '$.splitResult',
            ResultSelector: { 'count.$': '$.Payload.count' },
            Next: 'UpdateJobStatus',
          },
          UpdateJobStatus: {
            Type: 'Task',
            Resource: 'arn:aws:states:::dynamodb:updateItem',
            Parameters: {
              TableName: jobsTable.tableName,
              Key: {
                'id': { 'S.$': '$.id' },
                'itemId': { S: 'metadata' },
              },
              UpdateExpression: 'SET #s = :s',
              ExpressionAttributeNames: { '#s': 'status' },
              ExpressionAttributeValues: {
                ':s': { S: 'imported' },
              },
            },
            End: true,
          },
        },
      }),
    });

    // Allow starting any state machine in this account (avoids circular dependency
    // between state machines → role → policy → state machines)
    sfnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [`arn:aws:states:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:stateMachine:*`],
    }));

    // EventBridge Pipe: DDB Stream → Generate Step Functions (trigger on status=generate)
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });
    pipeRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
      resources: [jobsTable.tableStreamArn!],
    }));
    pipeRole.addToPolicy(new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [
        generateSfn.attrArn,
        parseDocSfn.attrArn,
      ],
    }));

    new pipes.CfnPipe(this, 'GeneratePipe', {
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
                  status: { S: ['generate'] },
                },
              },
            }),
          }],
        },
      },
      target: generateSfn.attrArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
    });

    // EventBridge Pipe: DDB Stream → ParseDoc Step Functions (trigger on status=docimport)
    new pipes.CfnPipe(this, 'ParseDocPipe', {
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
                  status: { S: ['docimport'] },
                },
              },
            }),
          }],
        },
      },
      target: parseDocSfn.attrArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
    });

    // Subscription resolvers (Local resolver with None data source)
    const noneDS = new appsync.CfnDataSource(this, 'NoneDataSource', {
      apiId: props.apiId,
      name: 'ReadableNone',
      type: 'NONE',
    });

    this.createResolver(props.apiId, 'Subscription', 'readableUpdateJobMetadata', noneDS.attrName,
      `{"version":"2017-02-28","payload":$util.toJson($ctx.args)}`,
      `$util.toJson($ctx.result)`);

    this.createResolver(props.apiId, 'Subscription', 'readableUpdateJobItem', noneDS.attrName,
      `{"version":"2017-02-28","payload":$util.toJson($ctx.args)}`,
      [
        '#set($res = $ctx.result)',
        '#if($util.isNull($res.itemId))',
        '  $util.qr($res.put("itemId", "subscription"))',
        '#end',
        '$util.toJson($res)',
      ].join('\n'));
  }

  private createResolver(
    apiId: string, typeName: string, fieldName: string,
    dataSourceName: string, requestTemplate: string, responseTemplate: string,
  ): void {
    new appsync.CfnResolver(this, `${typeName}${fieldName}Resolver`, {
      apiId,
      typeName,
      fieldName,
      dataSourceName,
      requestMappingTemplate: requestTemplate,
      responseMappingTemplate: responseTemplate,
    });
  }

  private createLambda(
    constructId: string,
    functionName: string,
    blueprintsBucket: string,
    removalPolicy: cdk.RemovalPolicy,
    environment?: Record<string, string>,
  ): lambda.Function {
    const role = new iam.Role(this, `${constructId}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    return new lambda.Function(this, constructId, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(this, `${constructId}Bucket`, blueprintsBucket),
        `scenarios/simply-readable/lambda/${functionName}.zip`,
      ),
      role,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment,
    });
  }
}

// Seed Lambda code — populates model/print-style tables and enables Bedrock model agreements
const SEED_LAMBDA_CODE = [
  'const{DynamoDBClient,PutItemCommand}=require("@aws-sdk/client-dynamodb");',
  'const{BedrockClient,ListFoundationModelAgreementOffersCommand,CreateFoundationModelAgreementCommand,GetFoundationModelAvailabilityCommand}=require("@aws-sdk/client-bedrock");',
  'const https=require("https");',
  'exports.handler=async(e)=>{',
  '  const rp={Status:"SUCCESS",PhysicalResourceId:e.LogicalResourceId,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId};',
  '  if(e.RequestType==="Delete"){await send(e.ResponseURL,rp);return}',
  '  try{',
  '    const db=new DynamoDBClient();const br=new BedrockClient();const p=e.ResourceProperties;',
  '    const models=[{id:"anthropic.claude-3-haiku-20240307-v1:0",name:"Claude 3 Haiku",type:"text",default:true},{id:"amazon.nova-canvas-v1:0",name:"Amazon Nova Canvas",type:"image",default:true}];',
  '    for(const m of models){',
  '      await db.send(new PutItemCommand({TableName:p.ModelTableName,Item:{id:{S:m.id},modelId:{S:m.id},name:{S:m.name},type:{S:m.type},default:{BOOL:m.default}}}));',
  '      try{',
  '        const avail=await br.send(new GetFoundationModelAvailabilityCommand({modelId:m.id}));',
  '        if(avail.agreementAvailability!=="AVAILABLE"){',
  '          const offers=await br.send(new ListFoundationModelAgreementOffersCommand({modelId:m.id}));',
  '          if(offers.modelAgreementOffers&&offers.modelAgreementOffers.length>0){',
  '            await br.send(new CreateFoundationModelAgreementCommand({modelId:m.id,offerToken:offers.modelAgreementOffers[0].offerToken}));',
  '            console.log("Enabled model agreement for",m.id)',
  '          }',
  '        }else{console.log("Model already available:",m.id)}',
  '      }catch(err){console.warn("Could not enable model agreement for",m.id,err.message)}',
  '    }',
  '    const styles=[{id:"default",name:"Default",type:"default",default:true}];',
  '    for(const s of styles){await db.send(new PutItemCommand({TableName:p.PrintStyleTableName,Item:{id:{S:s.id},name:{S:s.name},type:{S:s.type},default:{BOOL:s.default}}}))}',
  '    await send(e.ResponseURL,rp)',
  '  }catch(err){console.error(err);rp.Status="FAILED";rp.Reason=err.message;await send(e.ResponseURL,rp)}',
  '};',
  'function send(u,d){return new Promise((ok,fail)=>{const b=JSON.stringify(d);const o=new URL(u);const opts={hostname:o.hostname,port:443,path:o.pathname+o.search,method:"PUT",headers:{"Content-Type":"","Content-Length":b.length}};const req=https.request(opts,ok);req.on("error",fail);req.write(b);req.end()})}',
].join('\n');
