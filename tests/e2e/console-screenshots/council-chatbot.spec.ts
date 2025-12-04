import { test, expect } from '@playwright/test';
import {
  createAuthenticatedSession,
  captureAndUpload,
  withRetry,
  CaptureResult,
  UploadConfig
} from './screenshot-helper.js';
import { closeConsoleSession, getStackOutputs, buildConsoleUrl } from '../../../src/lib/aws-federation.js';
import { CircuitBreaker } from '../../../src/lib/circuit-breaker.js';
import { ScenarioCapture, ScreenshotMetadata } from '../../../src/lib/screenshot-manifest.js';

const SCENARIO = 'council-chatbot';
const STACK_NAME = 'ndx-reference-council-chatbot';
const REGION = 'us-west-2';

const SCREENSHOT_PAGES = [
  { name: 'lambda-function-overview', service: 'lambda' as const, outputKey: 'ChatbotFunctionArn' },
  { name: 'lambda-function-config', service: 'lambda' as const, outputKey: 'ChatbotFunctionArn', tab: 'configuration' },
  { name: 'lambda-function-monitoring', service: 'lambda' as const, outputKey: 'ChatbotFunctionArn', tab: 'monitoring' },
  { name: 'lambda-function-code', service: 'lambda' as const, outputKey: 'ChatbotFunctionArn', tab: 'code' },
  { name: 'dynamodb-table-overview', service: 'dynamodb' as const, outputKey: 'ConversationTableArn' },
  { name: 'dynamodb-table-items', service: 'dynamodb' as const, outputKey: 'ConversationTableArn', tab: 'items' },
  { name: 'dynamodb-table-metrics', service: 'dynamodb' as const, outputKey: 'ConversationTableArn', tab: 'metrics' },
  { name: 's3-bucket-knowledge-overview', service: 's3' as const, outputKey: 'KnowledgeBucketName' },
  { name: 's3-bucket-knowledge-objects', service: 's3' as const, outputKey: 'KnowledgeBucketName', tab: 'objects' },
  { name: 's3-bucket-knowledge-properties', service: 's3' as const, outputKey: 'KnowledgeBucketName', tab: 'properties' },
  { name: 'cloudformation-stack-overview', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudformation-stack-resources', service: 'cloudformation' as const, outputKey: 'StackArn', tab: 'resources' },
  { name: 'cloudformation-stack-outputs', service: 'cloudformation' as const, outputKey: 'StackArn', tab: 'outputs' },
  { name: 'cloudformation-stack-parameters', service: 'cloudformation' as const, outputKey: 'StackArn', tab: 'parameters' },
  { name: 'cloudformation-stack-template', service: 'cloudformation' as const, outputKey: 'StackArn', tab: 'template' },
  { name: 'cloudwatch-logs-function', service: 'cloudwatch' as const, outputKey: 'ChatbotFunctionArn' },
];

test.describe('Council Chatbot Screenshots', () => {
  test.skip(!process.env.AWS_FEDERATION_ACCESS_KEY_ID, 'AWS credentials not available');

  const circuitBreaker = new CircuitBreaker(0.5);
  const screenshots: CaptureResult[] = [];
  const errors: string[] = [];

  // Upload config from environment
  const uploadConfig: UploadConfig | undefined = process.env.SCREENSHOT_BUCKET_NAME
    ? { bucketName: process.env.SCREENSHOT_BUCKET_NAME, region: REGION }
    : undefined;

  test.beforeAll(async () => {
    // Verify stack exists
    try {
      await getStackOutputs(STACK_NAME, REGION);
    } catch {
      test.skip(true, `Stack ${STACK_NAME} not available`);
    }
  });

  for (const pageConfig of SCREENSHOT_PAGES) {
    test(`capture ${pageConfig.name}`, async ({ browser }) => {
      // Circuit breaker: fail fast if failure rate exceeds 50%
      if (circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker OPEN - failure rate exceeded 50%. Halting scenario.');
      }

      try {
        const result = await withRetry(async () => {
          const session = await createAuthenticatedSession({
            scenario: SCENARIO,
            stackName: STACK_NAME,
            region: REGION
          });

          try {
            const outputs = await getStackOutputs(STACK_NAME, REGION);
            const url = buildConsoleUrl(
              outputs[pageConfig.outputKey],
              pageConfig.service,
              REGION
            );

            await session.page.goto(url);
            await session.page.waitForLoadState('networkidle');

            const result = await captureAndUpload(
              session.page,
              pageConfig.name,
              SCENARIO,
              uploadConfig
            );

            return result;
          } finally {
            await closeConsoleSession(session);
          }
        });

        screenshots.push(result);
        circuitBreaker.recordSuccess();
        expect(result.buffer.length).toBeGreaterThan(0);
      } catch (error) {
        circuitBreaker.recordFailure();
        errors.push(`${pageConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
  }

  test.afterAll(async () => {
    // Log capture summary
    console.log(`Captured ${screenshots.length}/${SCREENSHOT_PAGES.length} screenshots`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
  });
});
