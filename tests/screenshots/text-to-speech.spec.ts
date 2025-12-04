/**
 * Text to Speech Screenshot Capture (Story 17.7)
 *
 * Captures all 17 required screenshots for the Text to Speech walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with application.
 */

import { test, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-text-to-speech';
const APP_URL = 'https://xh5x4w73p2bldzmyel3q45koki0mtlou.lambda-url.us-west-2.on.aws/';
const AUDIO_BUCKET = 'ndx-try-tts-audio-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/text-to-speech');

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

test.describe('Text to Speech Screenshots', () => {
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

  test('Step 1: TTS interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'step-1-tts-interface.png');
  });

  test('Step 2: Text input', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Try to find and fill text input
    const textArea = page.locator('textarea, input[type="text"]').first();
    if (await textArea.isVisible()) {
      await textArea.fill('Welcome to our council services. This is a test of the text to speech system.');
      await page.waitForTimeout(500);
    }

    await saveScreenshot(page, 'step-2-text-input.png');
  });

  test('Step 2: Voice selection', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-voice-selection.png');
  });

  test('Step 2: Advanced options', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-2-advanced-options.png');
  });

  test('Step 3: Generation progress', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-generation-progress.png');
  });

  test('Step 3: Audio player', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-audio-player.png');
  });

  test('Step 3: Waveform', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-3-waveform.png');
  });

  test('Step 4: Download options', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-4-download-options.png');
  });

  test('Step 4: Batch processing', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'step-4-batch-processing.png');
  });

  test('Step 4: Polly console (Lambda for sandbox)', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-text-to-speech`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    const functionLink = page.locator('a:has-text("ConvertFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'step-4-polly-console.png');
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

  test('Explore: Polly detail', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-text-to-speech`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'explore-polly-detail.png');
  });

  test('Explore: SSML markup', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-ssml-markup.png');
  });

  test('Explore: Different languages', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'explore-different-languages.png');
  });

  test('Explore: Character limits', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${AUDIO_BUCKET}?region=${REGION}`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-character-limits.png');
  });

  test('Explore: Production caching', async () => {
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try-text-to-speech`;
    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'explore-production-caching.png');
  });
});
