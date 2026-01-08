import { test, expect, Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * LocalGov Drupal AI Feature Screenshot Tests
 * Story 6.6: AI Feature Screenshot Pipeline
 *
 * Captures screenshots of AI features in the deployed Drupal instance:
 * - CKEditor AI toolbar buttons
 * - AI Writing Assistant dialogs
 * - Simplify Content before/after
 * - TTS language options
 * - Translation widget
 * - Alt-text generation
 * - PDF conversion
 *
 * Environment variables:
 * - DRUPAL_URL: Deployed Drupal instance URL
 * - DRUPAL_ADMIN_USER: Admin username (default: admin)
 * - DRUPAL_ADMIN_PASS: Admin password (from Secrets Manager)
 */

// Configuration with type safety
interface DrupalTestConfig {
  drupalUrl: string;
  adminUser: string;
  adminPass: string;
  screenshotDir: string;
}

function getTestConfig(): DrupalTestConfig {
  const drupalUrl = process.env.DRUPAL_URL || 'http://NdxDrupal-ALB-production-1636052025.us-east-1.elb.amazonaws.com';

  // Validate URL format
  try {
    new URL(drupalUrl);
  } catch {
    throw new Error(`Invalid DRUPAL_URL: ${drupalUrl}`);
  }

  return {
    drupalUrl,
    adminUser: process.env.DRUPAL_ADMIN_USER || 'admin',
    adminPass: process.env.DRUPAL_ADMIN_PASS || '',
    screenshotDir: 'src/assets/images/walkthroughs/localgov-drupal/ai-features'
  };
}

const CONFIG = getTestConfig();

// Login result type for better error handling
interface LoginResult {
  success: boolean;
  reason?: 'no_credentials' | 'auth_failed' | 'network_error';
}

/**
 * Helper: Find element with fallback selectors
 */
async function findElementWithFallbacks(
  page: Page,
  selectors: string[],
  timeout: number = 5000
): Promise<Locator | null> {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout });
      if (isVisible) {
        return element;
      }
    } catch {
      // Try next selector
      continue;
    }
  }
  return null;
}

/**
 * Helper: Wait for AJAX/loading to complete
 */
async function waitForAjaxComplete(page: Page, timeout: number = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  // Wait for loading indicators to disappear
  await page.locator('.ajax-progress, .loading-indicator, .throbber').first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => { /* May not exist */ });
}

/**
 * Helper: Log in to Drupal admin
 * Returns structured result for better error handling
 */
async function loginToDrupal(page: Page): Promise<LoginResult> {
  if (!CONFIG.adminPass) {
    return { success: false, reason: 'no_credentials' };
  }

  try {
    await page.goto(`${CONFIG.drupalUrl}/user/login`, {
      timeout: 15000,
      waitUntil: 'networkidle'
    });

    // Fill login form
    await page.fill('input[name="name"]', CONFIG.adminUser);
    await page.fill('input[name="pass"]', CONFIG.adminPass);
    await page.click('input[type="submit"]');

    // Wait for login attempt and check for success
    await page.waitForLoadState('networkidle');

    // Check for successful login using proper wait
    try {
      await page.locator('body.user-logged-in, .toolbar-menu-administration')
        .waitFor({ state: 'visible', timeout: 10000 });
      return { success: true };
    } catch {
      // Check if error message exists
      const errorVisible = await page.locator('.messages--error').isVisible().catch(() => false);
      if (errorVisible) {
        console.error('Login failed: Invalid credentials');
      }
      return { success: false, reason: 'auth_failed' };
    }
  } catch (error) {
    console.error('Network error during login:', error);
    return { success: false, reason: 'network_error' };
  }
}

/**
 * Helper: Save screenshot with proper naming convention
 * Format: {feature}-{view}-{state}-{viewport}.png
 */
async function saveScreenshot(
  page: Page,
  name: string,
  viewport: string,
  fullPage: boolean = false
): Promise<string> {
  const filename = `${name}-${viewport}.png`;
  const screenshotPath = path.join(CONFIG.screenshotDir, filename);

  await page.screenshot({
    path: screenshotPath,
    fullPage,
    animations: 'disabled'
  });

  // Log screenshot info
  const stats = fs.statSync(screenshotPath);
  const fileSizeKB = stats.size / 1024;
  console.log(`Captured: ${filename} (${fileSizeKB.toFixed(1)}KB)`);

  return screenshotPath;
}

test.describe('LocalGov Drupal AI Features Screenshots', () => {
  test.beforeAll(() => {
    // Ensure screenshot directory exists
    const dir = path.resolve(CONFIG.screenshotDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check for required credentials
    if (!CONFIG.adminPass) {
      console.warn('WARNING: DRUPAL_ADMIN_PASS not set. Screenshots requiring login will be skipped.');
    }
  });

  test.describe('CKEditor AI Toolbar', () => {
    test('Capture AI toolbar buttons in CKEditor', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      if (!CONFIG.adminPass) {
        test.skip(true, 'DRUPAL_ADMIN_PASS environment variable not set');
        return;
      }

      const loginResult = await loginToDrupal(page);
      if (!loginResult.success) {
        if (loginResult.reason === 'auth_failed') {
          console.error('Authentication failed - credentials may be invalid');
        }
        test.skip(true, `Cannot login: ${loginResult.reason}`);
        return;
      }

      // Navigate to content edit page
      await page.goto(`${CONFIG.drupalUrl}/admin/content`);
      await waitForAjaxComplete(page);

      // Click edit on first node using fallback selectors
      const editLink = await findElementWithFallbacks(page, [
        'td.views-field-operations a:has-text("Edit")',
        'a:has-text("Edit")',
        '.dropbutton-action a[href*="/edit"]'
      ], 5000);

      if (editLink) {
        await editLink.click();
        await waitForAjaxComplete(page);

        // Wait for CKEditor to initialize
        try {
          await page.locator('.ck-editor__editable').waitFor({ state: 'visible', timeout: 15000 });
        } catch {
          console.log('CKEditor not found on page');
          return;
        }

        // Capture full editor with AI toolbar
        await saveScreenshot(page, 'ckeditor-toolbar-default', viewport, false);

        // Find AI toolbar buttons with fallbacks
        const aiWritingButton = await findElementWithFallbacks(page, [
          '.ndx-ai-toolbar-button[data-action="ai-writing"]',
          'button:has-text("AI Writing")',
          '[data-cke-tooltip-text*="AI"]',
          '.ai-writing-button'
        ], 5000);

        if (aiWritingButton) {
          await aiWritingButton.scrollIntoViewIfNeeded();
          await saveScreenshot(page, 'ai-writing-button-location', viewport, false);
        }

        // Find Simplify button with fallbacks
        const simplifyButton = await findElementWithFallbacks(page, [
          '.ndx-simplify-button',
          'button:has-text("Simplify")',
          '[aria-label*="Simplify"]'
        ], 5000);

        if (simplifyButton) {
          await simplifyButton.scrollIntoViewIfNeeded();
          await saveScreenshot(page, 'simplify-button-location', viewport, false);
        }
      }
    });
  });

  test.describe('AI Writing Assistant', () => {
    test('Capture AI Writing dialog states', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      if (!CONFIG.adminPass) {
        test.skip(true, 'DRUPAL_ADMIN_PASS environment variable not set');
        return;
      }

      const loginResult = await loginToDrupal(page);
      if (!loginResult.success) {
        test.skip(true, `Cannot login: ${loginResult.reason}`);
        return;
      }

      await page.goto(`${CONFIG.drupalUrl}/admin/content`);
      await waitForAjaxComplete(page);

      const editLink = await findElementWithFallbacks(page, [
        'a:has-text("Edit")'
      ], 5000);

      if (editLink) {
        await editLink.click();
        await waitForAjaxComplete(page);

        try {
          await page.locator('.ck-editor__editable').waitFor({ state: 'visible', timeout: 15000 });
        } catch {
          console.log('CKEditor not found');
          return;
        }

        // Find and click AI Writing button
        const aiButton = await findElementWithFallbacks(page, [
          '.ndx-ai-toolbar-button',
          'button:has-text("AI Writing")',
          '[data-drupal-selector="ai-writing"]'
        ], 5000);

        if (aiButton) {
          await aiButton.click();

          // Wait for dialog to appear
          const dialog = page.locator('.ui-dialog, [role="dialog"], .modal');
          try {
            await dialog.waitFor({ state: 'visible', timeout: 5000 });
          } catch {
            console.log('AI Writing dialog did not appear');
            return;
          }

          await saveScreenshot(page, 'ai-writing-dialog-open', viewport, false);

          // Fill prompt if input is visible
          const promptInput = dialog.locator('textarea, input[type="text"]').first();
          if (await promptInput.isVisible({ timeout: 2000 })) {
            await promptInput.fill('Write a brief introduction for council services');
            await saveScreenshot(page, 'ai-writing-dialog-filled', viewport, false);
          }

          // Click submit and capture loading state
          const submitButton = await findElementWithFallbacks(page, [
            'button:has-text("Generate")',
            'button:has-text("Submit")',
            'input[type="submit"]'
          ], 3000);

          if (submitButton) {
            await submitButton.click();
            await saveScreenshot(page, 'ai-writing-loading-state', viewport, false);

            // Wait for AI response (loading indicator to disappear or response to appear)
            try {
              await page.locator('.ai-response, [data-ai-response], textarea[name*="response"]')
                .waitFor({ state: 'visible', timeout: 30000 });
              await saveScreenshot(page, 'ai-writing-response-ready', viewport, false);
            } catch {
              // Capture whatever state we're in after waiting
              await saveScreenshot(page, 'ai-writing-response-timeout', viewport, false);
            }
          }
        }
      }
    });
  });

  test.describe('Simplify Content Feature', () => {
    test('Capture Simplify Content before/after', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      if (!CONFIG.adminPass) {
        test.skip(true, 'DRUPAL_ADMIN_PASS environment variable not set');
        return;
      }

      const loginResult = await loginToDrupal(page);
      if (!loginResult.success) {
        test.skip(true, `Cannot login: ${loginResult.reason}`);
        return;
      }

      await page.goto(`${CONFIG.drupalUrl}/admin/content`);
      await waitForAjaxComplete(page);

      const editLink = await findElementWithFallbacks(page, ['a:has-text("Edit")'], 5000);
      if (editLink) {
        await editLink.click();
        await waitForAjaxComplete(page);

        try {
          await page.locator('.ck-editor__editable').waitFor({ state: 'visible', timeout: 15000 });
        } catch {
          console.log('CKEditor not found');
          return;
        }

        // Select text in the editor using platform-agnostic shortcut
        const editor = page.locator('.ck-editor__editable').first();
        if (await editor.isVisible()) {
          await editor.click();
          // Platform-agnostic select all
          const selectAllKey = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
          await page.keyboard.press(selectAllKey);
          await saveScreenshot(page, 'simplify-text-selected', viewport, false);
        }

        // Find Simplify button
        const simplifyButton = await findElementWithFallbacks(page, [
          '.ndx-simplify-button',
          'button:has-text("Simplify")',
          '[data-drupal-selector="simplify"]'
        ], 5000);

        if (simplifyButton) {
          await simplifyButton.click();

          // Wait for dialog to appear
          const dialog = page.locator('.ui-dialog, [role="dialog"], .modal');
          try {
            await dialog.waitFor({ state: 'visible', timeout: 5000 });
          } catch {
            console.log('Simplify dialog did not appear');
            return;
          }

          await saveScreenshot(page, 'simplify-dialog-open', viewport, false);

          // Wait for simplification to complete (look for simplified content)
          try {
            await dialog.locator('.simplified-text, [data-simplified="true"], .after-text')
              .waitFor({ state: 'visible', timeout: 30000 });
            await saveScreenshot(page, 'simplify-before-after-ready', viewport, false);
          } catch {
            await saveScreenshot(page, 'simplify-processing', viewport, false);
          }

          // Capture apply button if visible
          const applyButton = await findElementWithFallbacks(page, [
            'button:has-text("Apply")',
            'button:has-text("Accept")',
            'input[value="Apply"]'
          ], 3000);

          if (applyButton) {
            await saveScreenshot(page, 'simplify-apply-action', viewport, false);
          }
        }
      }
    });
  });

  test.describe('Text-to-Speech (TTS)', () => {
    test('Capture TTS player on content page', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      // Go to public content page (doesn't require login)
      await page.goto(CONFIG.drupalUrl);
      await waitForAjaxComplete(page);

      // Navigate to a services or guides page where TTS block appears
      const contentLink = await findElementWithFallbacks(page, [
        'a[href*="/services/"]',
        'a[href*="/guides/"]',
        '.localgov-page a',
        'a:has-text("Services")'
      ], 5000);

      if (contentLink) {
        await contentLink.click();
        await waitForAjaxComplete(page);
      }

      // Look for the TTS player block (appears in content_top region)
      const ttsPlayer = await findElementWithFallbacks(page, [
        '.tts-player',
        '.block-ndx-listen-to-page',
        '[class*="listen-to-page"]',
        '.region-content-top .block'
      ], 5000);

      if (ttsPlayer) {
        // Scroll TTS player into view and capture it
        await ttsPlayer.scrollIntoViewIfNeeded();

        // Capture just the TTS player block
        await ttsPlayer.screenshot({
          path: `${CONFIG.screenshotDir}/tts-player-${viewport}.png`,
          animations: 'disabled'
        });
        console.log(`Captured: tts-player-${viewport}.png`);

        // Capture the page with TTS player visible
        await saveScreenshot(page, 'tts-page-with-player', viewport, false);

        // Find and interact with the language dropdown
        const languageSelect = await findElementWithFallbacks(page, [
          '.tts-language',
          '.tts-player select',
          'select[aria-label*="language"]',
          '.govuk-select'
        ], 3000);

        if (languageSelect) {
          // Focus on the language dropdown
          await languageSelect.focus();
          await saveScreenshot(page, 'tts-language-focused', viewport, false);
        }

        // Find the play button
        const playButton = await findElementWithFallbacks(page, [
          '.tts-play',
          '.tts-player button:has-text("Play")',
          'button[aria-label*="Play"]'
        ], 3000);

        if (playButton) {
          await playButton.scrollIntoViewIfNeeded();
          await saveScreenshot(page, 'tts-play-button', viewport, false);
        }

        // Find speed control if present
        const speedControl = await findElementWithFallbacks(page, [
          '.tts-speed',
          '.tts-player__speed',
          'input[aria-label*="speed"]'
        ], 3000);

        if (speedControl) {
          await speedControl.scrollIntoViewIfNeeded();
          await saveScreenshot(page, 'tts-speed-control', viewport, false);
        }
      } else {
        // TTS player not found, capture the page overview anyway
        await saveScreenshot(page, 'tts-page-overview', viewport, false);
        console.log('TTS player not found on page - may not be deployed or on wrong content type');
      }
    });

    test('Capture TTS player on guides page', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      // Try to navigate directly to guides
      await page.goto(`${CONFIG.drupalUrl}/guides`);
      await waitForAjaxComplete(page);

      // Click on first guide if available
      const guideLink = await findElementWithFallbacks(page, [
        '.view-localgov-guides a',
        'a[href*="/guides/"]',
        '.field--name-title a'
      ], 5000);

      if (guideLink) {
        await guideLink.click();
        await waitForAjaxComplete(page);

        // Look for TTS player on the guide page
        const ttsPlayer = await findElementWithFallbacks(page, [
          '.tts-player',
          '.block-ndx-listen-to-page',
          '[class*="listen-to-page"]'
        ], 5000);

        if (ttsPlayer) {
          await ttsPlayer.scrollIntoViewIfNeeded();
          await saveScreenshot(page, 'tts-guide-page', viewport, false);

          // Capture just the player
          await ttsPlayer.screenshot({
            path: `${CONFIG.screenshotDir}/tts-player-guide-${viewport}.png`,
            animations: 'disabled'
          });
          console.log(`Captured: tts-player-guide-${viewport}.png`);
        }
      }
    });
  });

  test.describe('Content Translation', () => {
    test('Capture translation widget', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await page.goto(CONFIG.drupalUrl);
      await waitForAjaxComplete(page);

      // Navigate to a content page
      const contentLink = await findElementWithFallbacks(page, [
        'a[href*="/services/"]',
        'a[href*="/guides/"]'
      ], 5000);

      if (contentLink) {
        await contentLink.click();
        await waitForAjaxComplete(page);
      }

      // Look for translation button
      const translateButton = await findElementWithFallbacks(page, [
        '.translate-button',
        'button:has-text("Translate")',
        '[aria-label*="Translate"]'
      ], 5000);

      if (translateButton) {
        await translateButton.scrollIntoViewIfNeeded();
        await saveScreenshot(page, 'translate-button-location', viewport, false);

        // Click to open translation options
        await translateButton.click();

        // Wait for language selector to appear
        const languageSelector = page.locator('.translate-language-select, .language-dropdown, select[name*="translate"]');
        try {
          await languageSelector.waitFor({ state: 'visible', timeout: 3000 });
          await languageSelector.click();

          // Wait for options to expand
          await page.locator('option, li[role="option"]').first()
            .waitFor({ state: 'visible', timeout: 2000 })
            .catch(() => {});
          await saveScreenshot(page, 'translate-language-selector-expanded', viewport, false);

          // Try to select Spanish and capture translated state
          const spanishOption = page.locator('option[value="es"], li:has-text("Spanish")').first();
          if (await spanishOption.isVisible({ timeout: 2000 })) {
            await spanishOption.click();
            // Wait for translation to complete
            await waitForAjaxComplete(page, 10000);
            await saveScreenshot(page, 'translate-content-spanish', viewport, false);
          }
        } catch {
          // Translation widget may not be present
        }
      }
    });
  });

  test.describe('Alt-Text Generation', () => {
    test('Capture alt-text generation on media upload', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      if (!CONFIG.adminPass) {
        test.skip(true, 'DRUPAL_ADMIN_PASS environment variable not set');
        return;
      }

      const loginResult = await loginToDrupal(page);
      if (!loginResult.success) {
        test.skip(true, `Cannot login: ${loginResult.reason}`);
        return;
      }

      // Navigate to media library
      await page.goto(`${CONFIG.drupalUrl}/admin/content/media`);
      await waitForAjaxComplete(page);
      await saveScreenshot(page, 'media-library-overview', viewport, false);

      // Click Add media
      const addMediaButton = await findElementWithFallbacks(page, [
        'a:has-text("Add media")',
        '.action-links a'
      ], 5000);

      if (addMediaButton) {
        await addMediaButton.click();
        await waitForAjaxComplete(page);

        // Look for image upload option
        const imageOption = await findElementWithFallbacks(page, [
          'a:has-text("Image")',
          '.media-type-image'
        ], 5000);

        if (imageOption) {
          await imageOption.click();
          await waitForAjaxComplete(page);
          await saveScreenshot(page, 'media-upload-form', viewport, false);

          // Look for alt-text field with AI indicator
          const altTextField = await findElementWithFallbacks(page, [
            'input[name*="alt"]',
            'textarea[name*="alt"]',
            '[aria-label*="Alternative text"]'
          ], 3000);

          if (altTextField) {
            await altTextField.scrollIntoViewIfNeeded();
            await saveScreenshot(page, 'alt-text-field-location', viewport, false);
          }

          // Look for AI generate button near alt-text
          const generateAltButton = await findElementWithFallbacks(page, [
            'button:has-text("Generate")',
            '.ai-generate-alt',
            '[aria-label*="Generate alt"]'
          ], 3000);

          if (generateAltButton) {
            await saveScreenshot(page, 'alt-text-generate-button', viewport, false);
          }
        }
      }
    });
  });

  test.describe('PDF Conversion', () => {
    test('Capture PDF conversion interface', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      if (!CONFIG.adminPass) {
        test.skip(true, 'DRUPAL_ADMIN_PASS environment variable not set');
        return;
      }

      const loginResult = await loginToDrupal(page);
      if (!loginResult.success) {
        test.skip(true, `Cannot login: ${loginResult.reason}`);
        return;
      }

      // Navigate to PDF conversion tool (if available)
      await page.goto(`${CONFIG.drupalUrl}/admin/content/pdf-conversion`);
      await waitForAjaxComplete(page);

      const pageTitle = page.locator('h1, .page-title');
      const pageExists = await pageTitle.isVisible({ timeout: 5000 }).catch(() => false);

      if (pageExists) {
        await saveScreenshot(page, 'pdf-conversion-tool', viewport, false);

        // Look for upload form
        const uploadForm = await findElementWithFallbacks(page, [
          'input[type="file"]',
          '.pdf-upload-area'
        ], 3000);

        if (uploadForm) {
          await saveScreenshot(page, 'pdf-upload-interface', viewport, false);
        }
      } else {
        // Try content add form with PDF option
        await page.goto(`${CONFIG.drupalUrl}/node/add`);
        await waitForAjaxComplete(page);
        await saveScreenshot(page, 'content-types-list', viewport, false);
      }
    });
  });

  test.describe('Homepage and Navigation', () => {
    test('Capture homepage with AI feature indicators', async ({ page }, testInfo) => {
      const viewport = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';

      await page.goto(CONFIG.drupalUrl);
      await waitForAjaxComplete(page);

      // Capture homepage
      await saveScreenshot(page, 'homepage-overview-default', viewport, true);

      // Capture demo banner
      const demoBanner = await findElementWithFallbacks(page, [
        '.demo-banner',
        '.ndx-demo-banner',
        '[class*="demo-banner"]'
      ], 3000);

      if (demoBanner) {
        await saveScreenshot(page, 'demo-banner-visible', viewport, false);
      }

      // Capture services landing
      const servicesLink = await findElementWithFallbacks(page, [
        'a[href*="/services"]',
        'a:has-text("Services")'
      ], 3000);

      if (servicesLink) {
        await servicesLink.click();
        await waitForAjaxComplete(page);
        await saveScreenshot(page, 'services-landing-default', viewport, true);
      }
    });
  });
});

// Test to verify screenshot count and generate manifest
test.describe('Screenshot Verification', () => {
  test('Verify screenshot count and generate manifest', async () => {
    const dir = path.resolve(CONFIG.screenshotDir);

    if (!fs.existsSync(dir)) {
      console.log('Screenshot directory does not exist yet');
      return;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
    console.log(`Total screenshots: ${files.length}`);

    // Generate manifest with detailed metadata
    const manifest = {
      generated: new Date().toISOString(),
      project: 'LocalGov Drupal AI Features',
      drupalUrl: CONFIG.drupalUrl,
      hasAdminCredentials: !!CONFIG.adminPass,
      count: files.length,
      screenshots: files.map(f => {
        const stats = fs.statSync(path.join(dir, f));
        // Parse filename to extract metadata
        const parts = f.replace('.png', '').split('-');
        const viewport = parts.pop() || 'unknown';
        const feature = parts.length > 0 ? parts[0] : 'unknown';

        return {
          filename: f,
          feature,
          viewport,
          size: `${(stats.size / 1024).toFixed(1)}KB`,
          bytes: stats.size
        };
      })
    };

    const manifestPath = path.join(dir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest written to: ${manifestPath}`);

    // Log all screenshots
    files.forEach(f => console.log(`  - ${f}`));

    // Verify minimum screenshot count
    expect(files.length).toBeGreaterThanOrEqual(4);
  });
});
