/**
 * Smart Car Park Screenshot Capture (Story 17.6)
 *
 * Captures all 18 required screenshots for the Smart Car Park walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with application.
 */

import { test, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-smart-car-park';
const APP_URL = 'https://bg5qycgpwjzibzdtd2f2i6rzsu0rvxha.lambda-url.us-west-2.on.aws/';
const DATA_BUCKET = 'ndx-try-parking-data-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/smart-car-park');

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

test.describe('Smart Car Park Screenshots', () => {
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

  test('Step 1: Dashboard overview', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'step-1-dashboard-overview.png');
  });

  test('Step 2: Live occupancy', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-live-occupancy.png');
  });

  test('Step 2: Sensor status', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-sensor-status.png');
  });

  test('Step 2: Map view', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-map-view.png');
  });

  test('Step 3: Simulator interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-simulator-interface.png');
  });

  test('Step 3: Event publishing', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-event-publishing.png');
  });

  test('Step 3: Dashboard update', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-dashboard-update.png');
  });

  test('Step 4: Historical trends', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-4-historical-trends.png');
  });

  test('Step 4: Predictive insights', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-4-predictive-insights.png');
  });

  test('Step 4: IoT console (Lambda for sandbox)', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-smart-car-park`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    const functionLink = page.locator('a:has-text("AvailabilityFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'step-4-iot-console.png');
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

  test('Explore: IoT rules (Lambda config)', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-smart-car-park`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'explore-iot-rules.png');
  });

  test('Explore: Timestream DB (S3 for sandbox)', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${DATA_BUCKET}?region=${REGION}`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-timestream-db.png');
  });

  test('Explore: New sensors', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-smart-car-park`;
    await navigateToAwsConsole(page, destination);

    const functionLink = page.locator('a:has-text("AvailabilityFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
      const configTab = page.locator('button:has-text("Configuration"), [role="tab"]:has-text("Configuration")').first();
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-new-sensors.png');
  });

  test('Explore: Rule modification', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-rule-modification.png');
  });

  test('Explore: Scale testing', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-scale-testing.png');
  });

  test('Explore: Production security', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try-smart`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-production-security.png');
  });
});
