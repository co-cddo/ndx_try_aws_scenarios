/**
 * Planning AI Screenshot Capture (Story 17.4)
 *
 * Captures all 15 required screenshots for the Planning AI walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with application.
 */

import { test, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-planning-ai';
const APP_URL = 'https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/';
const DOCUMENTS_BUCKET = 'ndx-try-planning-docs-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/planning-ai');

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

test.describe('Planning AI Screenshots', () => {
  test.skip(!hasCredentials, 'AWS credentials with session token required');
  test.setTimeout(300000);

  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
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

  test('Step 1: Application interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'step-1-application-interface.png');
  });

  test('Step 2: Upload interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.upload-zone', { timeout: 10000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-upload-interface.png');
  });

  test('Step 2: Sample document selected', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Click sample document button
    await page.click('#sampleBtn');
    await page.waitForTimeout(1000);

    // Verify file info shows selected
    await page.waitForSelector('.file-info.visible', { timeout: 5000 });
    await saveScreenshot(page, 'step-2-sample-selected.png');
  });

  test('Step 2: Processing status', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Click sample document button
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);

    // Click analyze button
    await page.click('#analyzeBtn');

    // Quickly capture loading state
    await page.waitForSelector('.loading.visible', { timeout: 5000 });
    await saveScreenshot(page, 'step-2-processing-status.png');
  });

  test('Step 3: Extraction results', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Click sample document button
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);

    // Click analyze button and wait for results
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await saveScreenshot(page, 'step-3-extraction-results.png');
  });

  test('Step 3: Analysis recommendation', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Complete workflow
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);
    await page.click('#analyzeBtn');
    await page.waitForSelector('.recommendation', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to analysis section
    await page.evaluate(() => {
      document.querySelector('.analysis-section')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-3-analysis-recommendation.png');
  });

  test('Step 3: Issues and recommendations', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Complete workflow
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);
    await page.click('#analyzeBtn');
    await page.waitForSelector('.issues-list', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll to issues section
    await page.evaluate(() => {
      document.querySelector('.issues-list')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-3-issues-recommendations.png');
  });

  test('Step 4: Full results view', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#sampleBtn', { timeout: 10000 });

    // Complete workflow
    await page.click('#sampleBtn');
    await page.waitForTimeout(500);
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await saveScreenshot(page, 'step-4-full-results.png');
  });

  test('Step 4: Textract console (Lambda for sandbox)', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-planning`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    const functionLink = page.locator('a:has-text("AnalyzerFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'step-4-textract-console.png');
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

  test('Explore: Textract detail', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-planning`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'explore-textract-detail.png');
  });

  test('Explore: Custom queries', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-planning`;
    await navigateToAwsConsole(page, destination);

    const functionLink = page.locator('a:has-text("AnalyzerFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
      const configTab = page.locator('button:has-text("Configuration"), [role="tab"]:has-text("Configuration")').first();
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-custom-queries.png');
  });

  test('Explore: Different documents', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${DOCUMENTS_BUCKET}?region=${REGION}`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-different-documents.png');
  });

  test('Explore: Accuracy testing', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-accuracy-testing.png');
  });

  test('Explore: Production considerations', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try-planning`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-production-considerations.png');
  });
});
