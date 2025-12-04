/**
 * Integration tests for AWS Console Federation Flow
 * Story: S0.2 - Playwright Integration Library
 *
 * These tests validate the end-to-end federation flow:
 * 1. Actual AWS authentication via STS
 * 2. Console navigation with federated session
 * 3. Session cleanup and resource management
 *
 * Requirements:
 * - AWS_ACCESS_KEY_ID environment variable (federation service account)
 * - AWS_SECRET_ACCESS_KEY environment variable (federation service account)
 * - Active internet connection to AWS APIs
 *
 * Tests are skipped if credentials are not available.
 */

import { test, expect } from '@playwright/test';
import {
  openAwsConsoleInPlaywright,
  closeConsoleSession,
  buildConsoleUrl,
  type FederationResponse,
} from '../../src/lib/aws-federation.js';

// Check for required credentials
const hasCredentials =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

// Skip all tests if credentials not available
test.describe('AWS Console Federation Flow (E2E)', () => {
  test.skip(!hasCredentials, 'AWS credentials required for federation tests');

  let session: FederationResponse | null = null;

  // Clean up session after each test
  test.afterEach(async () => {
    if (session) {
      await closeConsoleSession(session);
      session = null;
    }
  });

  test('should authenticate and open AWS Console home page', async () => {
    // Open console with federated credentials
    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: 'us-west-2',
    });

    // Verify session components
    expect(session).toBeDefined();
    expect(session.browser).toBeDefined();
    expect(session.page).toBeDefined();
    expect(session.credentials).toBeDefined();

    // Verify credentials structure
    expect(session.credentials.accessKeyId).toBeDefined();
    expect(session.credentials.secretAccessKey).toBeDefined();
    expect(session.credentials.sessionToken).toBeDefined();
    expect(session.credentials.expiration).toBeInstanceOf(Date);

    // Verify we're in AWS Console (check for navigation bar)
    const accountMenu = await session.page.$(
      '[data-testid="awsc-nav-account-menu-button"]'
    );
    expect(accountMenu).not.toBeNull();
  });

  test('should navigate to CloudFormation console', async () => {
    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: 'us-west-2',
    });

    // Navigate to CloudFormation
    await session.page.goto(
      'https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2'
    );

    // Wait for CloudFormation page to load
    await session.page.waitForLoadState('networkidle');

    // Verify we're in CloudFormation (page title or specific element)
    const url = session.page.url();
    expect(url).toContain('cloudformation');
  });

  test('should navigate to Lambda console', async () => {
    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: 'us-west-2',
    });

    // Navigate to Lambda
    await session.page.goto(
      'https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2'
    );

    // Wait for Lambda page to load
    await session.page.waitForLoadState('networkidle');

    // Verify we're in Lambda console
    const url = session.page.url();
    expect(url).toContain('lambda');
  });

  test('should open console with custom destination', async () => {
    const destination =
      'https://us-west-2.console.aws.amazon.com/s3/buckets?region=us-west-2';

    session = await openAwsConsoleInPlaywright(
      {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: 'us-west-2',
      },
      destination
    );

    // Wait for navigation to complete
    await session.page.waitForLoadState('networkidle');

    // Verify we're authenticated
    const accountMenu = await session.page.$(
      '[data-testid="awsc-nav-account-menu-button"]'
    );
    expect(accountMenu).not.toBeNull();

    // Verify we're in S3
    const url = session.page.url();
    expect(url).toContain('s3');
  });

  test('should handle session cleanup correctly', async () => {
    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: 'us-west-2',
    });

    const credentials = { ...session.credentials };

    // Close session
    await closeConsoleSession(session);

    // Verify credentials are cleared from session object
    expect(session.credentials.accessKeyId).toBeUndefined();
    expect(session.credentials.secretAccessKey).toBeUndefined();
    expect(session.credentials.sessionToken).toBeUndefined();

    // Verify browser is closed
    expect(session.browser.isConnected()).toBe(false);

    // Mark as cleaned up
    session = null;
  });

  test('should support custom session duration', async () => {
    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      durationSeconds: 7200, // 2 hours
      region: 'us-west-2',
    });

    expect(session.credentials).toBeDefined();
    expect(session.credentials.expiration).toBeInstanceOf(Date);

    // Verify expiration is in the future
    const now = new Date();
    expect(session.credentials.expiration.getTime()).toBeGreaterThan(
      now.getTime()
    );
  });

  test('should support inline policy restriction', async () => {
    // Define a restrictive policy (S3 read-only)
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:ListBucket'],
          Resource: '*',
        },
      ],
    });

    session = await openAwsConsoleInPlaywright({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      policy,
      region: 'us-west-2',
    });

    // Should successfully authenticate with restricted policy
    expect(session).toBeDefined();
    const accountMenu = await session.page.$(
      '[data-testid="awsc-nav-account-menu-button"]'
    );
    expect(accountMenu).not.toBeNull();
  });
});

test.describe('buildConsoleUrl Integration Tests', () => {
  test('should build valid Lambda console URL', () => {
    const arn =
      'arn:aws:lambda:us-west-2:123456789012:function:my-function';
    const url = buildConsoleUrl(arn, 'lambda');

    expect(url).toContain('lambda/home');
    expect(url).toContain('us-west-2');
    expect(url).toContain('my-function');
  });

  test('should build valid S3 console URL', () => {
    const arn = 'arn:aws:s3:::my-test-bucket';
    const url = buildConsoleUrl(arn, 's3');

    expect(url).toContain('s3/buckets');
    expect(url).toContain('my-test-bucket');
  });

  test('should build valid CloudFormation console URL', () => {
    const arn =
      'arn:aws:cloudformation:us-west-2:123456789012:stack/my-stack/abc123';
    const url = buildConsoleUrl(arn, 'cloudformation');

    expect(url).toContain('cloudformation/home');
    expect(url).toContain('stackinfo');
    expect(url).toContain(encodeURIComponent(arn));
  });

  test('should build valid DynamoDB console URL', () => {
    const arn =
      'arn:aws:dynamodb:us-west-2:123456789012:table/my-table';
    const url = buildConsoleUrl(arn, 'dynamodb');

    expect(url).toContain('dynamodbv2/home');
    expect(url).toContain('table?name=my-table');
  });

  test('should build valid CloudWatch console URL', () => {
    const arn = 'arn:aws:cloudwatch:us-west-2:123456789012:alarm:my-alarm';
    const url = buildConsoleUrl(arn, 'cloudwatch');

    expect(url).toContain('cloudwatch/home');
    expect(url).toContain('us-west-2');
  });
});

test.describe('Error Handling (E2E)', () => {
  test('should throw FEDERATION_FAILED for invalid credentials', async () => {
    await expect(
      openAwsConsoleInPlaywright({
        accessKeyId: 'INVALID_KEY',
        secretAccessKey: 'INVALID_SECRET',
        region: 'us-west-2',
      })
    ).rejects.toThrow('FEDERATION_FAILED');
  });

  test('should handle cleanup when session creation fails', async () => {
    let errorThrown = false;

    try {
      await openAwsConsoleInPlaywright({
        accessKeyId: 'INVALID_KEY',
        secretAccessKey: 'INVALID_SECRET',
        region: 'us-west-2',
      });
    } catch (error) {
      errorThrown = true;
      // Error should not contain credentials
      expect((error as Error).message).not.toContain('INVALID_KEY');
      expect((error as Error).message).not.toContain('INVALID_SECRET');
      // Should contain error code
      expect((error as Error).message).toContain('FEDERATION_FAILED');
    }

    expect(errorThrown).toBe(true);
  });
});
