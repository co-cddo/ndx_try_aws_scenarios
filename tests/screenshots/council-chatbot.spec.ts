/**
 * Council Chatbot Screenshot Capture (Story 17.3)
 *
 * Captures all 16 required screenshots for the Council Chatbot walkthrough.
 * Uses SSO federation for AWS Console access and direct interaction with chatbot.
 *
 * Prerequisites:
 * - AWS SSO credentials set as environment variables
 * - ndx-try-council-chatbot stack deployed in us-west-2
 *
 * Usage:
 *   npx playwright test tests/screenshots/council-chatbot.spec.ts
 */

import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import axios from 'axios';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const REGION = 'us-west-2';
const STACK_NAME = 'ndx-try-council-chatbot';
const CHATBOT_URL = 'https://f4ouix2syktkqs7srfv3ex3lye0teeil.lambda-url.us-west-2.on.aws/';
const KNOWLEDGE_BASE_BUCKET = 'ndx-try-chatbot-kb-449788867583-us-west-2';
const OUTPUT_DIR = join(process.cwd(), 'src/assets/images/screenshots/council-chatbot');

// Check for required credentials
const hasCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SESSION_TOKEN;

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Get AWS Console signin URL via federation endpoint
 */
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

/**
 * Navigate to AWS Console page with federation
 */
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
    // Default: wait for AWS nav bar
    await page.waitForSelector('[data-testid="awsc-nav-account-menu-button"]', {
      timeout: 60000,
    });
  }
  await page.waitForTimeout(2000);
}

/**
 * Save screenshot to output directory
 */
async function saveScreenshot(page: Page, filename: string): Promise<void> {
  const path = join(OUTPUT_DIR, filename);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${filename}`);
}

test.describe('Council Chatbot Screenshots', () => {
  test.skip(!hasCredentials, 'AWS credentials with session token required');
  test.setTimeout(300000); // 5 minutes for all screenshots

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
    const destination = `https://${REGION}.console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks/outputs?stackId=${encodeURIComponent(STACK_NAME)}&filteringStatus=active&filteringText=${STACK_NAME}`;

    await navigateToAwsConsole(page, destination);

    // Click on the stack to see outputs
    await page.waitForTimeout(2000);

    // Look for stack in the list and click on it
    const stackRow = page.locator(`text=${STACK_NAME}`).first();
    if (await stackRow.isVisible()) {
      await stackRow.click();
      await page.waitForTimeout(1500);

      // Click Outputs tab
      const outputsTab = page.locator('button:has-text("Outputs"), [role="tab"]:has-text("Outputs")').first();
      if (await outputsTab.isVisible()) {
        await outputsTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'step-1-cloudformation-outputs.png');
  });

  test('Step 1: Chatbot interface', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await saveScreenshot(page, 'step-1-chatbot-interface.png');
  });

  test('Step 2: Question input - bin collection', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Find the input field and type a question
    const inputField = page.locator('input[type="text"], textarea').first();
    if (await inputField.isVisible()) {
      await inputField.fill('When is my bin collection day?');
      await page.waitForTimeout(500);
    }

    await saveScreenshot(page, 'step-2-question-input.png');
  });

  test('Step 2: Response display', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Find and fill input
    const inputField = page.locator('input[type="text"], textarea').first();
    if (await inputField.isVisible()) {
      await inputField.fill('When is my bin collection day?');

      // Find and click send button
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000); // Wait for response
      }
    }

    await saveScreenshot(page, 'step-2-response-display.png');
  });

  test('Step 3: Council tax question', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const inputField = page.locator('input[type="text"], textarea').first();
    if (await inputField.isVisible()) {
      await inputField.fill('How do I pay my council tax?');

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000);
      }
    }

    await saveScreenshot(page, 'step-3-council-tax.png');
  });

  test('Step 3: Planning question', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const inputField = page.locator('input[type="text"], textarea').first();
    if (await inputField.isVisible()) {
      await inputField.fill('How do I apply for planning permission?');

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000);
      }
    }

    await saveScreenshot(page, 'step-3-planning.png');
  });

  test('Step 3: Multi-turn conversation', async () => {
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const inputField = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();

    // Send multiple questions
    const questions = [
      'When is my bin collection?',
      'What about recycling?',
      'Can I report a missed collection?',
    ];

    for (const question of questions) {
      if (await inputField.isVisible()) {
        await inputField.fill(question);
        if (await sendButton.isVisible()) {
          await sendButton.click();
          await page.waitForTimeout(2500);
        }
      }
    }

    await saveScreenshot(page, 'step-3-multi-turn.png');
  });

  test('Step 4: Conversation summary', async () => {
    // Reuse the multi-turn state or create new
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const inputField = page.locator('input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();

    const questions = [
      'What services does the council offer?',
      'How do I contact the council?',
    ];

    for (const question of questions) {
      if (await inputField.isVisible()) {
        await inputField.fill(question);
        if (await sendButton.isVisible()) {
          await sendButton.click();
          await page.waitForTimeout(2500);
        }
      }
    }

    await saveScreenshot(page, 'step-4-conversation-summary.png');
  });

  test('Step 4: Lambda console (Bedrock equivalent for sandbox)', async () => {
    // In sandbox mode, we show Lambda instead of Bedrock
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    // Try to click on the chatbot function
    const functionRow = page.locator('text=ChatbotFunction').first();
    if (await functionRow.isVisible()) {
      await functionRow.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'step-4-bedrock-console.png');
  });

  test('Explore: Architecture overview', async () => {
    // Navigate to CloudFormation designer or resources view
    const destination = `https://${REGION}.console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks/resources?stackId=${encodeURIComponent(STACK_NAME)}&filteringStatus=active&filteringText=${STACK_NAME}`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    // Click on stack
    const stackRow = page.locator(`text=${STACK_NAME}`).first();
    if (await stackRow.isVisible()) {
      await stackRow.click();
      await page.waitForTimeout(1500);

      // Click Resources tab
      const resourcesTab = page.locator('button:has-text("Resources"), [role="tab"]:has-text("Resources")').first();
      if (await resourcesTab.isVisible()) {
        await resourcesTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-architecture-overview.png');
  });

  test('Explore: Bedrock agent (Lambda config)', async () => {
    // Show Lambda function configuration
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-council-chatbot`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    // Click on the function
    const functionLink = page.locator('a:has-text("ChatbotFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'explore-bedrock-agent.png');
  });

  test('Explore: Knowledge base (S3 bucket)', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/buckets/${KNOWLEDGE_BASE_BUCKET}?region=${REGION}`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);

    await saveScreenshot(page, 'explore-knowledge-base.png');
  });

  test('Explore: Prompt modification (Lambda env vars)', async () => {
    // Show Lambda configuration/environment variables
    const destination = `https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions?nameFilter=ndx-try-council-chatbot`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(2000);

    // Navigate to function and configuration tab
    const functionLink = page.locator('a:has-text("ChatbotFunction")').first();
    if (await functionLink.isVisible()) {
      await functionLink.click();
      await page.waitForTimeout(2000);

      // Click Configuration tab
      const configTab = page.locator('button:has-text("Configuration"), [role="tab"]:has-text("Configuration")').first();
      if (await configTab.isVisible()) {
        await configTab.click();
        await page.waitForTimeout(1500);
      }
    }

    await saveScreenshot(page, 'explore-prompt-modification.png');
  });

  test('Explore: Knowledge update (S3 upload)', async () => {
    const destination = `https://s3.console.aws.amazon.com/s3/upload/${KNOWLEDGE_BASE_BUCKET}?region=${REGION}`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);

    await saveScreenshot(page, 'explore-knowledge-update.png');
  });

  test('Explore: Boundary testing', async () => {
    // Send an off-topic question to the chatbot
    await page.goto(CHATBOT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const inputField = page.locator('input[type="text"], textarea').first();
    if (await inputField.isVisible()) {
      await inputField.fill('What is the meaning of life?');

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"], button:has-text("Ask")').first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000);
      }
    }

    await saveScreenshot(page, 'explore-boundary-testing.png');
  });

  test('Explore: Production checklist (CloudWatch)', async () => {
    // Show CloudWatch logs as production monitoring example
    const destination = `https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups$3FlogGroupNameFilter$3Dndx-try`;

    await navigateToAwsConsole(page, destination);
    await page.waitForTimeout(3000);

    await saveScreenshot(page, 'explore-production-checklist.png');
  });
});
