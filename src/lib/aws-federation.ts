/**
 * AWS Console Federation Library for Playwright Tests
 * Story: S0.2 - Playwright Integration Library
 *
 * Enables Playwright tests to authenticate with AWS Console using federated credentials.
 * Implements secure, temporary session management with automatic cleanup.
 *
 * Security Features:
 * - No credential logging (error codes only)
 * - Automatic credential cleanup on session close
 * - No credential caching or persistence
 * - Session tokens only in memory during active session
 */

import { STSClient, GetFederationTokenCommand } from '@aws-sdk/client-sts';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { chromium, Browser, Page } from '@playwright/test';
import axios from 'axios';

// ============================================================================
// TypeScript Interfaces (AC2.9)
// ============================================================================

/**
 * Temporary AWS credentials from STS GetFederationToken
 */
export interface FederatedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

/**
 * Configuration for AWS Console federation
 */
export interface FederationConfig {
  /** AWS Access Key ID for the federation service account */
  accessKeyId: string;
  /** AWS Secret Access Key for the federation service account */
  secretAccessKey: string;
  /** Session duration in seconds (default: 3600 = 1 hour, max: 129600 = 36 hours) */
  durationSeconds?: number;
  /** Optional inline IAM policy to further restrict federated session permissions */
  policy?: string;
  /** AWS region (default: us-west-2) */
  region?: string;
}

/**
 * Response from opening AWS Console in Playwright
 */
export interface FederationResponse {
  /** Playwright browser instance */
  browser: Browser;
  /** Authenticated page in AWS Console */
  page: Page;
  /** Temporary credentials used for federation */
  credentials: FederatedCredentials;
}

/**
 * Internal interface for signin token response from AWS federation endpoint
 */
interface SigninTokenResponse {
  SigninToken: string;
}

// ============================================================================
// Error Codes (Security: Never log credentials)
// ============================================================================

const ERROR_CODES = {
  FEDERATION_FAILED: 'FEDERATION_FAILED',
  SIGNIN_TOKEN_FAILED: 'SIGNIN_TOKEN_FAILED',
  CONSOLE_OPEN_FAILED: 'CONSOLE_OPEN_FAILED',
  AUTH_TIMEOUT: 'AUTH_TIMEOUT',
  CLEANUP_FAILED: 'CLEANUP_FAILED',
} as const;

// ============================================================================
// Retry Logic with Exponential Backoff (AC2.7)
// ============================================================================

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  maxTotalTime: 10000, // 10 seconds total
  delays: [1000, 2000, 4000], // Exponential: 1s, 2s, 4s
} as const;

/**
 * Execute function with retry logic and exponential backoff
 * Handles rate limit errors (429, ThrottlingException)
 *
 * @param fn - Async function to retry
 * @param errorCode - Error code to throw on final failure
 * @returns Result of successful function execution
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  errorCode: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable (rate limiting)
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('429') ||
          error.message.includes('ThrottlingException') ||
          error.message.includes('TooManyRequestsException'));

      // Don't retry on last attempt or non-retryable errors
      if (attempt === RETRY_CONFIG.maxRetries - 1 || !isRetryable) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = RETRY_CONFIG.delays[attempt] || 4000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries failed - throw with error code only (NEVER log credentials)
  throw new Error(
    `${errorCode}: Operation failed after ${RETRY_CONFIG.maxRetries} attempts. Last error: ${lastError?.name || 'Unknown'}`
  );
}

// ============================================================================
// AWS Federation Functions
// ============================================================================

/**
 * Get temporary federated credentials from STS (AC2.2)
 *
 * @param config - Federation configuration
 * @returns Temporary AWS credentials
 */
async function getFederatedCredentials(
  config: FederationConfig
): Promise<FederatedCredentials> {
  const region = config.region || 'us-west-2';
  const stsClient = new STSClient({
    region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new GetFederationTokenCommand({
    Name: 'PlaywrightConsoleSession',
    DurationSeconds: config.durationSeconds || 3600,
    Policy: config.policy, // Optional inline policy for further restriction
  });

  return withRetry(async () => {
    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('No credentials returned from GetFederationToken');
    }

    // Validate all required credential fields are present (security: no null assertions)
    if (
      !response.Credentials.AccessKeyId ||
      !response.Credentials.SecretAccessKey ||
      !response.Credentials.SessionToken ||
      !response.Credentials.Expiration
    ) {
      throw new Error('Incomplete credentials returned from GetFederationToken');
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
    };
  }, ERROR_CODES.FEDERATION_FAILED);
}

/**
 * Exchange temporary credentials for AWS Console signin token (AC2.3)
 *
 * @param credentials - Temporary AWS credentials from STS
 * @returns Signin token for AWS Console
 */
async function getSigninToken(
  credentials: FederatedCredentials
): Promise<string> {
  const sessionJson = {
    sessionId: credentials.accessKeyId,
    sessionKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
  };

  const params = new URLSearchParams({
    Action: 'getSigninToken',
    SessionDuration: '3600', // 1 hour
    Session: JSON.stringify(sessionJson),
  });

  return withRetry(async () => {
    const response = await axios.get<SigninTokenResponse>(
      `https://signin.aws.amazon.com/federation?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.SigninToken) {
      throw new Error('No SigninToken in response');
    }

    return response.data.SigninToken;
  }, ERROR_CODES.SIGNIN_TOKEN_FAILED);
}

/**
 * Construct AWS Console login URL with signin token (AC2.4)
 *
 * @param signinToken - Token from AWS federation endpoint
 * @param destination - Console destination URL (defaults to us-west-2 home)
 * @returns Complete login URL
 */
function buildFederationLoginUrl(
  signinToken: string,
  destination?: string
): string {
  const defaultDestination =
    'https://us-west-2.console.aws.amazon.com/console/home?region=us-west-2';
  const dest = destination || defaultDestination;

  const params = new URLSearchParams({
    Action: 'login',
    Issuer: 'PlaywrightTestAutomation',
    Destination: dest,
    SigninToken: signinToken,
  });

  return `https://signin.aws.amazon.com/federation?${params.toString()}`;
}

/**
 * Wait for AWS Console authentication to complete (AC2.6)
 *
 * @param page - Playwright page
 */
async function waitForAuthentication(page: Page): Promise<void> {
  try {
    // Wait for AWS Console account menu button (indicates successful authentication)
    await page.waitForSelector('[data-testid="awsc-nav-account-menu-button"]', {
      timeout: 30000,
    });
  } catch (error) {
    throw new Error(
      `${ERROR_CODES.AUTH_TIMEOUT}: Failed to detect authenticated state within 30 seconds`
    );
  }
}

// ============================================================================
// Main Public API
// ============================================================================

/**
 * Open AWS Console in Playwright with federated authentication
 *
 * This is the main entry point for the federation library. It:
 * 1. Gets temporary credentials from STS
 * 2. Exchanges them for a signin token
 * 3. Constructs the login URL
 * 4. Opens Chromium browser and navigates to AWS Console
 * 5. Waits for authentication to complete
 *
 * @param config - Federation configuration with service account credentials
 * @param destination - Optional AWS Console destination URL
 * @returns Browser, page, and credentials for the session
 *
 * @example
 * ```typescript
 * const session = await openAwsConsoleInPlaywright({
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 * });
 *
 * // Use session.page for testing
 * await session.page.goto('https://us-west-2.console.aws.amazon.com/lambda');
 *
 * // Clean up when done
 * await closeConsoleSession(session);
 * ```
 */
export async function openAwsConsoleInPlaywright(
  config: FederationConfig,
  destination?: string
): Promise<FederationResponse> {
  try {
    // AC2.2: Get temporary credentials from STS
    const credentials = await getFederatedCredentials(config);

    // AC2.3: Exchange credentials for signin token
    const signinToken = await getSigninToken(credentials);

    // AC2.4: Construct login URL
    const loginUrl = buildFederationLoginUrl(signinToken, destination);

    // AC2.5: Launch Chromium browser
    const browser = await chromium.launch({
      headless: true, // Change to false for debugging
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login URL
    await page.goto(loginUrl);

    // AC2.6: Wait for authenticated state
    await waitForAuthentication(page);

    return {
      browser,
      page,
      credentials,
    };
  } catch (error) {
    // Use error codes only - NEVER log credentials
    if (error instanceof Error && error.message.includes('ERROR_CODE')) {
      throw error;
    }
    throw new Error(
      `${ERROR_CODES.CONSOLE_OPEN_FAILED}: ${error instanceof Error ? error.name : 'Unknown error'}`
    );
  }
}

/**
 * Close AWS Console session and clean up resources (AC2.8)
 *
 * This function:
 * - Closes the browser context
 * - Clears credentials from memory
 * - Handles cleanup errors gracefully
 *
 * @param response - Federation response from openAwsConsoleInPlaywright
 */
export async function closeConsoleSession(
  response: FederationResponse
): Promise<void> {
  try {
    // Close browser
    if (response.browser) {
      await response.browser.close();
    }

    // Clear credentials from memory (security requirement)
    // @ts-expect-error - Intentionally clearing credentials
    response.credentials.accessKeyId = undefined;
    // @ts-expect-error - Intentionally clearing credentials
    response.credentials.secretAccessKey = undefined;
    // @ts-expect-error - Intentionally clearing credentials
    response.credentials.sessionToken = undefined;
  } catch (error) {
    // Log cleanup errors but don't throw - cleanup is best effort
    // Security: Only log error code and name, never stack traces which could contain credentials
    // Suppress in production to prevent any accidental credential exposure
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        ERROR_CODES.CLEANUP_FAILED,
        error instanceof Error ? error.name : 'Error'
      );
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build AWS Console URL for a specific resource
 *
 * Extracts resource information from ARN and constructs the appropriate
 * AWS Console URL for the given service.
 *
 * @param arn - AWS ARN of the resource
 * @param service - AWS service type
 * @param region - AWS region (defaults to region from ARN)
 * @returns AWS Console URL for the resource
 *
 * @example
 * ```typescript
 * const lambdaUrl = buildConsoleUrl(
 *   'arn:aws:lambda:us-west-2:123456789012:function:my-function',
 *   'lambda'
 * );
 * // Returns: https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/my-function
 * ```
 */
export function buildConsoleUrl(
  arn: string,
  service: 'lambda' | 's3' | 'cloudformation' | 'dynamodb' | 'cloudwatch',
  region?: string
): string {
  // Parse ARN: arn:partition:service:region:account-id:resource
  const arnParts = arn.split(':');
  const arnRegion = region || arnParts[3] || 'us-west-2';
  const resourcePart = arnParts.slice(5).join(':'); // Everything after account-id

  const baseUrl = `https://${arnRegion}.console.aws.amazon.com`;

  switch (service) {
    case 'lambda': {
      // Extract function name from resource part
      // Format: function:function-name or function/function-name
      const functionName = resourcePart.replace(/^function[:/]/, '');
      return `${baseUrl}/lambda/home?region=${arnRegion}#/functions/${functionName}`;
    }

    case 's3': {
      // Extract bucket name from resource part
      const bucketName = resourcePart;
      return `${baseUrl}/s3/buckets/${bucketName}`;
    }

    case 'cloudformation': {
      // Extract stack name from resource part
      // Format: stack/stack-name/stack-id
      const stackId = encodeURIComponent(arn);
      return `${baseUrl}/cloudformation/home?region=${arnRegion}#/stacks/stackinfo?stackId=${stackId}`;
    }

    case 'dynamodb': {
      // Extract table name from resource part
      // Format: table/table-name
      const tableName = resourcePart.replace(/^table\//, '');
      return `${baseUrl}/dynamodbv2/home?region=${arnRegion}#table?name=${tableName}`;
    }

    case 'cloudwatch': {
      return `${baseUrl}/cloudwatch/home?region=${arnRegion}`;
    }

    default:
      throw new Error(`Unsupported service: ${service}`);
  }
}

/**
 * Get CloudFormation stack outputs as key-value map
 *
 * @param stackName - Name of the CloudFormation stack
 * @param region - AWS region (defaults to us-west-2)
 * @returns Map of output keys to values
 *
 * @example
 * ```typescript
 * const outputs = await getStackOutputs('my-stack', 'us-west-2');
 * const bucketName = outputs['BucketName'];
 * const functionArn = outputs['FunctionArn'];
 * ```
 */
export async function getStackOutputs(
  stackName: string,
  region: string = 'us-west-2'
): Promise<Record<string, string>> {
  // Get credentials from environment
  const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined;

  const cfnClient = new CloudFormationClient({
    region,
    credentials,
  });

  const command = new DescribeStacksCommand({
    StackName: stackName,
  });

  const response = await cfnClient.send(command);
  const stack = response.Stacks?.[0];

  if (!stack || !stack.Outputs) {
    return {};
  }

  // Convert outputs array to key-value map
  return stack.Outputs.reduce(
    (acc, output) => {
      if (output.OutputKey && output.OutputValue) {
        acc[output.OutputKey] = output.OutputValue;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}
