/**
 * SSO-Compatible Federation Test
 * Story: 17.0 - Deploy Sprint 0 Screenshot Infrastructure
 *
 * Tests AWS Console federation using existing SSO session credentials.
 * Unlike GetFederationToken, this approach works with assumed-role credentials.
 */

import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';

// Check for required credentials
const hasCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SESSION_TOKEN;

test.describe('SSO-Compatible AWS Console Federation', () => {
  test.skip(!hasCredentials, 'AWS credentials with session token required');

  // Increase timeout for AWS console operations
  test.setTimeout(120000);

  test('should authenticate and capture CloudFormation console screenshot', async () => {
    console.log('Starting SSO federation test...');

    // Build session JSON for federation endpoint
    const sessionJson = {
      sessionId: process.env.AWS_ACCESS_KEY_ID!,
      sessionKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN!,
    };

    console.log('Getting signin token from AWS federation endpoint...');

    // Get signin token from AWS federation endpoint
    const params = new URLSearchParams({
      Action: 'getSigninToken',
      SessionDuration: '3600',
      Session: JSON.stringify(sessionJson),
    });

    const tokenResponse = await axios.get(
      `https://signin.aws.amazon.com/federation?${params.toString()}`
    );

    expect(tokenResponse.data.SigninToken).toBeDefined();
    const signinToken = tokenResponse.data.SigninToken;
    console.log('Got signin token successfully');

    // Build login URL for CloudFormation console
    const destination = 'https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks';
    const loginParams = new URLSearchParams({
      Action: 'login',
      Issuer: 'NDXTryScreenshotCapture',
      Destination: destination,
      SigninToken: signinToken,
    });

    const loginUrl = `https://signin.aws.amazon.com/federation?${loginParams.toString()}`;
    console.log('Built login URL, launching browser...');

    // Launch browser and navigate - headless mode for CI/CD
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    try {
      console.log('Navigating to federation login URL...');
      // Navigate to federation login URL - AWS signin federation can be slow with redirects
      // Use domcontentloaded as AWS console pages load incrementally
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      console.log('DOM content loaded, current URL:', page.url());

      // Wait additional time for any redirects to complete
      await page.waitForTimeout(5000);
      console.log('After 5s wait, current URL:', page.url());

      // Take a screenshot immediately to see what's happening
      await page.screenshot({
        path: 'playwright-screenshots/debug-after-login.png',
        fullPage: true,
      });
      console.log('Saved debug screenshot');

      // Wait for AWS Console to load (look for navigation bar)
      console.log('Waiting for AWS Console to load...');
      await page.waitForSelector('[data-testid="awsc-nav-account-menu-button"]', {
        timeout: 60000,
      });

      // Verify we're in CloudFormation
      const url = page.url();
      expect(url).toContain('cloudformation');

      // Take a screenshot to prove it works
      const screenshotPath = 'playwright-screenshots/sso-federation-test.png';
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`Screenshot saved to: ${screenshotPath}`);
    } finally {
      await browser.close();
    }
  });

  test('should capture ndx-try-council-chatbot stack screenshot', async () => {
    // Build session JSON for federation endpoint
    const sessionJson = {
      sessionId: process.env.AWS_ACCESS_KEY_ID!,
      sessionKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN!,
    };

    // Get signin token
    const params = new URLSearchParams({
      Action: 'getSigninToken',
      SessionDuration: '3600',
      Session: JSON.stringify(sessionJson),
    });

    const tokenResponse = await axios.get(
      `https://signin.aws.amazon.com/federation?${params.toString()}`
    );

    const signinToken = tokenResponse.data.SigninToken;

    // Navigate directly to the council-chatbot stack
    const stackArn = encodeURIComponent('ndx-try-council-chatbot');
    const destination = `https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/outputs?filteringStatus=active&filteringText=ndx-try-council-chatbot`;

    const loginParams = new URLSearchParams({
      Action: 'login',
      Issuer: 'NDXTryScreenshotCapture',
      Destination: destination,
      SigninToken: signinToken,
    });

    const loginUrl = `https://signin.aws.amazon.com/federation?${loginParams.toString()}`;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    try {
      await page.goto(loginUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="awsc-nav-account-menu-button"]', {
        timeout: 30000,
      });

      // Wait a bit for the stack list to load
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = 'playwright-screenshots/council-chatbot-stack.png';
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`Screenshot saved to: ${screenshotPath}`);

      // Verify file was created
      const fs = await import('fs');
      expect(fs.existsSync(screenshotPath)).toBe(true);
    } finally {
      await browser.close();
    }
  });
});
