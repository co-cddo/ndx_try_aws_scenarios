import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

export interface BedrockConstructProps {
  readonly modelId: string;
  /** The shared archive bucket (S3 Files-backed) where Paperless documents land. */
  readonly archiveBucket: s3.IBucket;
  /** S3 key prefix the post-consume hook writes OCR text to (e.g. "kb/"). */
  readonly kbPrefix: string;
}

export class BedrockConstruct extends Construct {
  public readonly knowledgeBase: bedrock.CfnKnowledgeBase;
  public readonly dataSource: bedrock.CfnDataSource;
  public readonly guardrail: bedrock.CfnGuardrail;
  public readonly guardrailVersion: bedrock.CfnGuardrailVersion;
  public readonly modelId: string;

  constructor(scope: Construct, id: string, props: BedrockConstructProps) {
    super(scope, id);

    this.modelId = props.modelId;
    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    // S3 Vectors index for the KB.
    const vectorBucketName = `ndx-try-paperless-vectors-${accountId}-${region}`;
    const vectorBucket = new cdk.CfnResource(this, 'VectorBucket', {
      type: 'AWS::S3Vectors::VectorBucket',
      properties: { VectorBucketName: vectorBucketName },
    });
    vectorBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const vectorIndex = new cdk.CfnResource(this, 'VectorIndex', {
      type: 'AWS::S3Vectors::Index',
      properties: {
        VectorBucketName: vectorBucketName,
        IndexName: 'paperless-kb-index',
        DataType: 'float32',
        Dimension: 1024,
        DistanceMetric: 'cosine',
      },
    });
    vectorIndex.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    vectorIndex.addDependency(vectorBucket);

    const vectorIndexArn = `arn:aws:s3vectors:${region}:${accountId}:bucket/${vectorBucketName}/index/paperless-kb-index`;

    // Guardrail: PII anonymisation, banned topics, profanity.
    this.guardrail = new bedrock.CfnGuardrail(this, 'Guardrail', {
      name: `ndx-try-paperless-guardrail-${region}`,
      description: 'Content safety + PII guardrail for Paperless-ngx chat',
      blockedInputMessaging: 'I can only help with questions about the documents in this archive. Please rephrase your question.',
      blockedOutputsMessaging: 'I cannot share that. I can answer questions grounded in the documents in this archive.',
      contentPolicyConfig: {
        filtersConfig: [
          { type: 'HATE', inputStrength: 'HIGH', outputStrength: 'HIGH' },
          { type: 'INSULTS', inputStrength: 'HIGH', outputStrength: 'HIGH' },
          { type: 'SEXUAL', inputStrength: 'HIGH', outputStrength: 'HIGH' },
          { type: 'VIOLENCE', inputStrength: 'HIGH', outputStrength: 'HIGH' },
          { type: 'MISCONDUCT', inputStrength: 'HIGH', outputStrength: 'HIGH' },
          { type: 'PROMPT_ATTACK', inputStrength: 'HIGH', outputStrength: 'NONE' },
        ],
      },
      topicPolicyConfig: {
        topicsConfig: [
          {
            name: 'PoliticalOpinions',
            definition: 'Political party preferences, voting recommendations, partisan commentary.',
            type: 'DENY',
            examples: ['Which party should I vote for?', 'What do you think of the government?'],
          },
          {
            name: 'MedicalOrLegalAdvice',
            definition: 'Medical diagnosis, legal counsel, medication or treatment recommendations.',
            type: 'DENY',
            examples: ['What medication should I take?', 'Should I sue?'],
          },
        ],
      },
      sensitiveInformationPolicyConfig: {
        piiEntitiesConfig: [
          { type: 'NAME', action: 'ANONYMIZE' },
          { type: 'EMAIL', action: 'ANONYMIZE' },
          { type: 'PHONE', action: 'ANONYMIZE' },
          { type: 'ADDRESS', action: 'ANONYMIZE' },
          { type: 'UK_NATIONAL_INSURANCE_NUMBER', action: 'BLOCK' },
          { type: 'UK_NATIONAL_HEALTH_SERVICE_NUMBER', action: 'BLOCK' },
          { type: 'CREDIT_DEBIT_CARD_NUMBER', action: 'BLOCK' },
        ],
      },
      wordPolicyConfig: {
        managedWordListsConfig: [{ type: 'PROFANITY' }],
      },
    });

    this.guardrailVersion = new bedrock.CfnGuardrailVersion(this, 'GuardrailVersion', {
      guardrailIdentifier: this.guardrail.attrGuardrailArn,
    });

    const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
        conditions: {
          StringEquals: { 'aws:SourceAccount': accountId },
          ArnLike: {
            'aws:SourceArn': `arn:aws:bedrock:${region}:${accountId}:knowledge-base/*`,
          },
        },
      }),
    });

    kbRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:ListFoundationModels', 'bedrock:ListCustomModels'],
      resources: ['*'],
    }));
    kbRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [`arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0`],
    }));
    kbRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.archiveBucket.bucketArn],
      conditions: { StringEquals: { 'aws:ResourceAccount': accountId } },
    }));
    kbRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${props.archiveBucket.bucketArn}/${props.kbPrefix}*`],
      conditions: { StringEquals: { 'aws:ResourceAccount': accountId } },
    }));
    kbRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3vectors:PutVectors',
        's3vectors:GetVectors',
        's3vectors:DeleteVectors',
        's3vectors:QueryVectors',
        's3vectors:GetIndex',
      ],
      resources: [vectorIndexArn],
    }));

    this.knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'KnowledgeBase', {
      name: cdk.Fn.join('-', ['ndx-try-paperless-kb', region]),
      description: 'Paperless-ngx archive (S3 Files-backed) for chat-with-archive RAG',
      roleArn: kbRole.roleArn,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0`,
        },
      },
      storageConfiguration: {
        type: 'S3_VECTORS',
        s3VectorsConfiguration: { indexArn: vectorIndexArn } as any,
      },
    });
    this.knowledgeBase.addDependency(vectorIndex);
    this.knowledgeBase.node.addDependency(kbRole);

    this.dataSource = new bedrock.CfnDataSource(this, 'DataSource', {
      name: 'paperless-archive',
      knowledgeBaseId: this.knowledgeBase.attrKnowledgeBaseId,
      dataDeletionPolicy: 'DELETE',
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: props.archiveBucket.bucketArn,
          inclusionPrefixes: [props.kbPrefix],
        },
      },
    });
    this.dataSource.addDependency(this.knowledgeBase);
  }
}
