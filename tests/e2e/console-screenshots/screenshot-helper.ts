import { Page } from '@playwright/test';
import {
  openAwsConsoleInPlaywright,
  closeConsoleSession,
  buildConsoleUrl,
  getStackOutputs,
  FederationConfig,
  FederationResponse
} from '../../../src/lib/aws-federation.js';
import { CircuitBreaker } from '../../../src/lib/circuit-breaker.js';
import { ScreenshotMetadata, uploadScreenshotToS3 } from '../../../src/lib/screenshot-manifest.js';

export interface ScreenshotConfig {
  scenario: string;
  stackName: string;
  region?: string;
}

export interface CaptureResult {
  metadata: ScreenshotMetadata;
  buffer: Buffer;
}

export interface UploadConfig {
  bucketName: string;
  region?: string;
}

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

export async function captureScreenshot(
  page: Page,
  pageName: string,
  scenario: string
): Promise<CaptureResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${scenario}-${pageName}-${timestamp}.png`;

  const buffer = await page.screenshot({
    fullPage: true,
    type: 'png'
  });

  const viewport = page.viewportSize() || { width: 1280, height: 800 };

  return {
    metadata: {
      page: pageName,
      filename,
      dimensions: { width: viewport.width, height: viewport.height },
      size_bytes: buffer.length,
      timestamp: new Date().toISOString()
    },
    buffer
  };
}

/**
 * Capture screenshot and optionally upload to S3
 * @param page - Playwright page instance
 * @param pageName - Name of the page being captured
 * @param scenario - Scenario name
 * @param uploadConfig - Optional S3 upload configuration
 * @returns CaptureResult with metadata and buffer
 */
export async function captureAndUpload(
  page: Page,
  pageName: string,
  scenario: string,
  uploadConfig?: UploadConfig
): Promise<CaptureResult> {
  const result = await captureScreenshot(page, pageName, scenario);

  if (uploadConfig?.bucketName) {
    await uploadScreenshotToS3(
      result.buffer,
      result.metadata.filename,
      scenario,
      uploadConfig.bucketName,
      uploadConfig.region || 'us-west-2'
    );
  }

  return result;
}

export async function createAuthenticatedSession(
  config: ScreenshotConfig
): Promise<FederationResponse> {
  const federationConfig: FederationConfig = {
    accessKeyId: process.env.AWS_FEDERATION_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_FEDERATION_SECRET_ACCESS_KEY!,
    region: config.region || 'us-west-2'
  };

  const outputs = await getStackOutputs(config.stackName, config.region || 'us-west-2');
  const consoleHome = `https://${config.region || 'us-west-2'}.console.aws.amazon.com/console/home`;

  return await openAwsConsoleInPlaywright(federationConfig, consoleHome);
}

export function getConsoleUrlForResource(
  outputs: Record<string, string>,
  outputKey: string,
  service: 'lambda' | 's3' | 'cloudformation' | 'dynamodb' | 'cloudwatch',
  region: string = 'us-west-2'
): string {
  const arn = outputs[outputKey];
  if (!arn) {
    throw new Error(`Output key ${outputKey} not found in stack outputs`);
  }
  return buildConsoleUrl(arn, service, region);
}

export const scenarios = [
  'council-chatbot',
  'planning-ai',
  'foi-redaction',
  'smart-car-park',
  'text-to-speech',
  'quicksight'
] as const;

export type ScenarioName = typeof scenarios[number];
