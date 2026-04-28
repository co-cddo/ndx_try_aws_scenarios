import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Paperless-ngx Screenshot Capture Tests
 *
 * Captures screenshots of a deployed Paperless-ngx instance for the
 * NDX:Try scenario page. Requires:
 *   - PAPERLESS_URL: CloudFront URL of deployed Paperless
 *   - PAPERLESS_USER: Admin username (default: admin)
 *   - PAPERLESS_PASS: Admin password from Secrets Manager
 *   - CHAT_URL:       Chat-with-archive URL (CloudFront /chat/)
 *
 * Usage:
 *   PAPERLESS_URL=https://d2vlqn73rviuaf.cloudfront.net \
 *   CHAT_URL=https://d2vlqn73rviuaf.cloudfront.net/chat/ \
 *   PAPERLESS_PASS=... \
 *   npx playwright test tests/paperless-ngx-screenshots.spec.ts
 */

const PAPERLESS_URL = (process.env.PAPERLESS_URL || '').replace(/\/$/, '');
const PAPERLESS_USER = process.env.PAPERLESS_USER || 'admin';
const PAPERLESS_PASS = process.env.PAPERLESS_PASS || '';
const CHAT_URL = (process.env.CHAT_URL || `${PAPERLESS_URL}/chat/`).replace(/\/$/, '') + '/';

const SCREENSHOT_DIR = 'src/assets/images/screenshots/paperless-ngx';

function ensureDirectoryExists() {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function loginToPaperless(page: Page): Promise<void> {
  await page.goto(PAPERLESS_URL, { waitUntil: 'domcontentloaded' });
  // Paperless UI is an Angular SPA; wait for the username field to render.
  await page.waitForSelector('input[name="login"], input#inputUsername', { timeout: 30000 });
  const userInput = page.locator('input[name="login"], input#inputUsername').first();
  const passInput = page.locator('input[name="password"], input#inputPassword').first();
  await userInput.fill(PAPERLESS_USER);
  await passInput.fill(PAPERLESS_PASS);
  await page.locator('button[type="submit"]').first().click();
  // Wait for the dashboard to render (sidebar appears)
  await page.waitForSelector('nav, .sidebar, app-app-frame', { timeout: 30000 });
  // Allow content fetches to settle
  await page.waitForTimeout(2000);
}

async function snap(page: Page, name: string) {
  ensureDirectoryExists();
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved ${file}`);
}

test.describe('Paperless-ngx scenario screenshots', () => {
  test.beforeAll(() => {
    if (!PAPERLESS_URL) throw new Error('PAPERLESS_URL is required');
    if (!PAPERLESS_PASS) throw new Error('PAPERLESS_PASS is required');
    ensureDirectoryExists();
  });

  test('capture login screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAPERLESS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="login"], input#inputUsername', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await snap(page, '01-login');
  });

  test('capture dashboard, document list, single doc, search, chat', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginToPaperless(page);

    // Dashboard
    await snap(page, '02-dashboard');

    // Document list
    await page.goto(`${PAPERLESS_URL}/documents`);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await snap(page, '03-documents-list');

    // Single document — click the first AI-titled document
    const firstDoc = page.locator('a[href*="/documents/"]').first();
    if (await firstDoc.count() > 0) {
      await firstDoc.click();
      await page.waitForTimeout(3000);
      await snap(page, '04-document-detail');
    }

    // Tags page (shows AI-created tags)
    await page.goto(`${PAPERLESS_URL}/tags`);
    await page.waitForTimeout(2500);
    await snap(page, '05-tags');

    // Correspondents page (shows AI-extracted correspondents)
    await page.goto(`${PAPERLESS_URL}/correspondents`);
    await page.waitForTimeout(2500);
    await snap(page, '06-correspondents');

    // Document types
    await page.goto(`${PAPERLESS_URL}/documenttypes`);
    await page.waitForTimeout(2500);
    await snap(page, '07-document-types');

    // Search
    await page.goto(`${PAPERLESS_URL}/documents?query=planning`);
    await page.waitForTimeout(3000);
    await snap(page, '08-search');
  });

  test('capture chat with archive', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(CHAT_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await snap(page, '09-chat-empty');

    // Ask one of the example questions
    await page.locator('textarea#q').fill('What planning applications are currently being considered?');
    await page.locator('button#send').click();
    // Wait for the bot response (up to 60 seconds for Bedrock)
    await expect(page.locator('.msg.bot').nth(1)).toBeVisible({ timeout: 60000 });
    // Wait a bit more for streaming/citations to render
    await page.waitForTimeout(3000);
    await snap(page, '10-chat-answered');
  });
});
