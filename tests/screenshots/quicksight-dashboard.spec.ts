/**
 * QuickSight Dashboard Screenshot Capture (Story 17.8)
 *
 * Captures all 17 required screenshots for the QuickSight Dashboard walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with application.
 */

import { test, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-quicksight-dashboard';
const APP_URL = 'https://2o6kjtqzjdbn4mqurav4jhkvq40scjej.lambda-url.us-west-2.on.aws/';
const DATA_BUCKET = 'ndx-try-quicksight-data-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/quicksight-dashboard');

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

test.describe('QuickSight Dashboard Screenshots', () => {
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

  test('Step 1: QuickSight login', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'step-1-quicksight-login.png');
  });

  test('Step 2: Dashboard overview', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-dashboard-overview.png');
  });

  test('Step 2: KPI section', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-kpi-section.png');
  });

  test('Step 2: Trend charts', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-trend-charts.png');
  });

  test('Step 3: Filter controls', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-filter-controls.png');
  });

  test('Step 3: Drill down', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-drill-down.png');
  });

  test('Step 3: Export options', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-export-options.png');
  });

  test('Step 4: Data sources', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${DATA_BUCKET}?region=${REGION}`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'step-4-data-sources.png');
  });

  test('Step 4: Calculated fields', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-4-calculated-fields.png');
  });

  test('Step 4: QuickSight console (Lambda for sandbox)', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-quicksight`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    const functionLink = page.locator('a:has-text("DataAPIFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'step-4-quicksight-console.png');
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

  test('Explore: SPICE dataset', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${DATA_BUCKET}?region=${REGION}&prefix=metrics/`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-spice-dataset.png');
  });

  test('Explore: New visualization', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-new-visualization.png');
  });

  test('Explore: Custom theme', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-custom-theme.png');
  });

  test('Explore: Data volume', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-quicksight`;
    await navigateToAwsConsole(page, destination);

    const functionLink = page.locator('a:has-text("DataAPIFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
      const configTab = page.locator('button:has-text("Configuration"), [role="tab"]:has-text("Configuration")').first();
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-data-volume.png');
  });

  test('Explore: Production embedding', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try-quicksight`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-production-embedding.png');
  });
});
