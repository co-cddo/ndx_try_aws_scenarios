import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface QueuesConstructProps {}

export class QueuesConstruct extends Construct {
  public readonly transcriptionQueue: sqs.Queue;
  public readonly transcriptionDlq: sqs.Queue;
  public readonly llmQueue: sqs.Queue;
  public readonly llmDlq: sqs.Queue;

  constructor(scope: Construct, id: string, _props?: QueuesConstructProps) {
    super(scope, id);

    // Transcription Dead Letter Queue
    this.transcriptionDlq = new sqs.Queue(this, 'TranscriptionDLQ', {
      queueName: 'minute-transcription-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    // Transcription Queue
    this.transcriptionQueue = new sqs.Queue(this, 'TranscriptionQueue', {
      queueName: 'minute-transcription-queue',
      visibilityTimeout: cdk.Duration.seconds(1800), // 30 min for long transcriptions
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: this.transcriptionDlq,
        maxReceiveCount: 4,
      },
    });

    // LLM Dead Letter Queue
    this.llmDlq = new sqs.Queue(this, 'LlmDLQ', {
      queueName: 'minute-llm-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    // LLM Queue
    this.llmQueue = new sqs.Queue(this, 'LlmQueue', {
      queueName: 'minute-llm-queue',
      visibilityTimeout: cdk.Duration.seconds(1800),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: this.llmDlq,
        maxReceiveCount: 4,
      },
    });
  }
}
