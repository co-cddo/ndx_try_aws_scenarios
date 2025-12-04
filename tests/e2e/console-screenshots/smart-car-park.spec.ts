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

const SCENARIO = 'smart-car-park';
const STACK_NAME = 'ndx-reference-smart-car-park';
const REGION = 'us-west-2';

const SCREENSHOT_PAGES = [
  { name: 'iot-core-things', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'iot-core-thing-groups', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'iot-core-rules', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'lambda-processor-overview', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'lambda-processor-config', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'lambda-processor-monitoring', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'dynamodb-occupancy-table', service: 'dynamodb' as const, outputKey: 'OccupancyTableArn' },
  { name: 'dynamodb-occupancy-items', service: 'dynamodb' as const, outputKey: 'OccupancyTableArn' },
  { name: 'timestream-database', service: 'lambda' as const, outputKey: 'ProcessorFunctionArn' },
  { name: 'cloudformation-stack-overview', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudformation-stack-resources', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudformation-stack-outputs', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudformation-stack-parameters', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudformation-stack-template', service: 'cloudformation' as const, outputKey: 'StackArn' },
  { name: 'cloudwatch-logs-processor', service: 'cloudwatch' as const, outputKey: 'ProcessorFunctionArn' },
];

test.describe('Smart Car Park Screenshots', () => {
  test.skip(!process.env.AWS_FEDERATION_ACCESS_KEY_ID, 'AWS credentials not available');

  const circuitBreaker = new CircuitBreaker(0.5);
  const screenshots: CaptureResult[] = [];
  const errors: string[] = [];

  const uploadConfig: UploadConfig | undefined = process.env.SCREENSHOT_BUCKET_NAME
    ? { bucketName: process.env.SCREENSHOT_BUCKET_NAME, region: REGION }
    : undefined;

  test.beforeAll(async () => {
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
    console.log(`Captured ${screenshots.length}/${SCREENSHOT_PAGES.length} screenshots`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
  });
});
