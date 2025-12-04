/**
 * FOI Redaction Screenshot Capture (Story 20.5)
 *
 * Captures all required screenshots for the FOI Redaction walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with application.
 */

import { test, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-foi-redaction';
const APP_URL = 'https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/';
const DOCUMENTS_BUCKET = 'ndx-try-foi-docs-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/foi-redaction');

const hasCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SESSION_TOKEN;

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function getFederatedLoginUrl(destination: string): Promise<string> {
  const sessionJson = {
    sessionId: process.env.AWS_ACCESS_KEY_ID!,
    sessionKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  };

  const params = new URLSearchParams({
    Action: 'getSigninToken',
    SessionDuration: '3600',
    Session: JSON.stringify(sessionJson),
  });

  const tokenResponse = await axios.get(
    `https://signin.aws.amazon.com/federation?${params.toString()}`
  );

  const signinToken = tokenResponse.data.SigninToken;

  const loginParams = new URLSearchParams({
    Action: 'login',
    Issuer: 'NDXTryScreenshotCapture',
    Destination: destination,
    SigninToken: signinToken,
  });

  return `https://signin.aws.amazon.com/federation?${loginParams.toString()}`;
}

async function navigateToAwsConsole(
  page: Page,
  destination: string,
  waitForSelector?: string
): Promise<void> {
  const loginUrl = await getFederatedLoginUrl(destination);
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);

  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 60000 });
  } else {
    await page.waitForSelector('[data-testid="awsc-nav-account-menu-button"]', {
      timeout: 60000,
    });
  }
  await page.waitForTimeout(2000);
}

async function saveScreenshot(page: Page, filename: string): Promise<void> {
  const path = join(OUTPUT_DIR, filename);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${filename}`);
}

test.describe('FOI Redaction Screenshots', () => {
  test.skip(!hasCredentials, 'AWS credentials with session token required');
  test.setTimeout(300000);

  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Step 1: CloudFormation outputs', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks/outputs?filteringStatus=active&filteringText=${STACK_NAME}`;
    await navigateToAwsConsole(page, destination);

    const stackRow = page.locator(`text=${STACK_NAME}`).first();
    if (await stackRow.isVisible()) {
      await stackRow.click();
      await page.waitForTimeout(1500);
      const outputsTab = page.locator('button:has-text("Outputs"), [role="tab"]:has-text("Outputs")').first();
      if (await outputsTab.isVisible()) {
        await outputsTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'step-1-cloudformation-outputs.png');
  });

  test('Step 1: Text input interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#textInput', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'step-1-text-input-interface.png');
  });

  test('Step 2: Sample document loaded', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Click sample document button
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-2-sample-document-loaded.png');
  });

  test('Step 2: Character count indicator', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);

    // Focus the character count area
    await page.evaluate(() => {
      const charCount = document.getElementById('charCount');
      if (charCount) charCount.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-2-character-count.png');
  });

  test('Step 3: Loading state', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Load sample and click redact
    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');

    // Capture loading state immediately
    await page.waitForSelector('.loading.visible', { timeout: 5000 });
    await page.waitForTimeout(200);
    await saveScreenshot(page, 'step-3-loading-state.png');
  });

  test('Step 3: Redaction results summary', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Complete workflow
    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');

    // Wait for results
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await saveScreenshot(page, 'step-3-redaction-results-summary.png');
  });

  test('Step 3: Summary cards', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to summary cards
    await page.evaluate(() => {
      const summaryCards = document.getElementById('summaryCards');
      if (summaryCards) summaryCards.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-3-summary-cards.png');
  });

  test('Step 4: Redacted document output', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to redacted output
    await page.evaluate(() => {
      const redactedOutput = document.getElementById('redactedOutput');
      if (redactedOutput) redactedOutput.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-4-redacted-document-output.png');
  });

  test('Step 4: Redaction markers', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await saveScreenshot(page, 'step-4-redaction-markers.png');
  });

  test('Step 4: Redaction details table', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to redaction table
    await page.evaluate(() => {
      const table = document.getElementById('redactionTable');
      if (table) table.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-4-redaction-details-table.png');
  });

  test('Step 5: Confidence bars', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const table = document.getElementById('redactionTable');
      if (table) table.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-5-confidence-bars.png');
  });

  test('Step 5: Sandbox note', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to sample note at bottom
    await page.evaluate(() => {
      const note = document.querySelector('.sample-note');
      if (note) note.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-5-sandbox-note.png');
  });

  test('Step 5: Full results page', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    await page.click('#sampleBtn');
    await page.waitForTimeout(300);
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Full page screenshot
    await page.screenshot({
      path: join(OUTPUT_DIR, 'step-5-full-results.png'),
      fullPage: true
    });
    console.log('Saved: step-5-full-results.png');
  });

  test('Explore: Architecture overview', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks/resources?filteringStatus=active&filteringText=${STACK_NAME}`;
    await navigateToAwsConsole(page, destination);

    const stackRow = page.locator(`text=${STACK_NAME}`).first();
    if (await stackRow.isVisible()) {
      await stackRow.click();
      await page.waitForTimeout(1500);
      const resourcesTab = page.locator('button:has-text("Resources"), [role="tab"]:has-text("Resources")').first();
      if (await resourcesTab.isVisible()) {
        await resourcesTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-architecture-overview.png');
  });

  test('Explore: Lambda function', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-foi`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'explore-lambda-function.png');
  });

  test('Explore: Lambda configuration', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-foi`;
    await navigateToAwsConsole(page, destination);

    const functionLink = page.locator('a:has-text("RedactionFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
      const configTab = page.locator('button:has-text("Configuration"), [role="tab"]:has-text("Configuration")').first();
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-lambda-configuration.png');
  });

  test('Explore: S3 bucket', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${DOCUMENTS_BUCKET}?region=${REGION}`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-s3-bucket.png');
  });

  test('Explore: CloudWatch logs', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try-foi`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-cloudwatch-logs.png');
  });
});
