/**
 * FOI Redaction UI E2E Tests (Story 20.6)
 *
 * Comprehensive tests for the FOI Redaction web application covering:
 * - Page load and initial state
 * - Text input interface
 * - Sample document workflow
 * - Redaction results display
 * - Accessibility (axe-core)
 * - Keyboard navigation
 *
 * Prerequisites:
 * - ndx-try-foi-redaction stack deployed in us-west-2
 *
 * Usage:
 *   npx playwright test tests/e2e/foi-redaction-ui.spec.ts
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const FOI_REDACTION_URL = 'https://w6fqqfs2g4snys5reifxovnvae0nmkrq.lambda-url.us-west-2.on.aws/';

test.describe('FOI Redaction UI - Page Load', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(FOI_REDACTION_URL);
    await page.waitForLoadState('domcontentloaded');

    expect(errors).toHaveLength(0);
  });

  test('displays correct page title', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await expect(page).toHaveTitle(/FOI Redaction/);
  });

  test('displays NDX:Try header', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const header = page.locator('.header, header');
    await expect(header.first()).toContainText(/NDX/i);
    await expect(header.first()).toContainText(/FOI Redaction/i);
  });

  test('displays sandbox phase banner', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const phaseBanner = page.locator('.phase-banner');
    await expect(phaseBanner).toBeVisible();
    await expect(phaseBanner).toContainText(/Sandbox/i);
  });

  test('displays textarea for text input', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const textarea = page.locator('#textInput');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('maxlength', '5000');
  });

  test('displays character count indicator', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const charCount = page.locator('#charCount');
    await expect(charCount).toBeVisible();
    await expect(charCount).toContainText('0 / 5,000 characters');
  });

  test('displays sample document button', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const sampleBtn = page.locator('#sampleBtn');
    await expect(sampleBtn).toBeVisible();
    await expect(sampleBtn).toContainText(/Use Sample Document/i);
  });

  test('displays redact button (disabled initially)', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const redactBtn = page.locator('#redactBtn');
    await expect(redactBtn).toBeVisible();
    await expect(redactBtn).toBeDisabled();
    await expect(redactBtn).toContainText(/Redact Document/i);
  });
});

test.describe('FOI Redaction UI - Text Input Workflow', () => {
  test('sample document button loads text', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Click sample document button
    await page.click('#sampleBtn');

    // Textarea should have sample text
    const textarea = page.locator('#textInput');
    await expect(textarea).not.toBeEmpty();

    // Check for known sample content
    const value = await textarea.inputValue();
    expect(value).toContain('Freedom of Information');
    expect(value).toContain('john.smith@email.com');
  });

  test('character count updates on text entry', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#textInput');

    // Type some text
    await page.fill('#textInput', 'Test text input');

    // Character count should update
    const charCount = page.locator('#charCountNum');
    await expect(charCount).toContainText('15');
  });

  test('redact button enables after text entry', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Initially disabled
    const redactBtn = page.locator('#redactBtn');
    await expect(redactBtn).toBeDisabled();

    // Click sample document button
    await page.click('#sampleBtn');

    // Now enabled
    await expect(redactBtn).toBeEnabled();
  });

  test('character count updates with sample document', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Initially 0
    const charCount = page.locator('#charCountNum');
    await expect(charCount).toContainText('0');

    // Click sample document
    await page.click('#sampleBtn');

    // Should have characters
    const countText = await charCount.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThan(100);
  });
});

test.describe('FOI Redaction UI - Redaction Workflow', () => {
  test('shows loading state during redaction', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Select sample and redact
    await page.click('#sampleBtn');
    await page.click('#redactBtn');

    // Loading should be visible
    const loading = page.locator('.loading');
    await expect(loading).toHaveClass(/visible/, { timeout: 5000 });
    await expect(loading).toContainText(/Analyzing document/i);
  });

  test('hides input area during redaction', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Select sample and redact
    await page.click('#sampleBtn');
    await page.click('#redactBtn');

    // Form group should be hidden
    const formGroup = page.locator('.form-group');
    await expect(formGroup).toBeHidden({ timeout: 5000 });
  });

  test('displays results after redaction', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete redaction workflow
    await page.click('#sampleBtn');
    await page.click('#redactBtn');

    // Wait for results
    const results = page.locator('.results');
    await expect(results).toHaveClass(/visible/, { timeout: 30000 });
    await expect(results).toContainText(/Redaction Results/i);
  });

  test('displays summary cards with counts', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check summary cards
    const totalRedactions = page.locator('#totalRedactions');
    const countText = await totalRedactions.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThan(0);

    const piiTypes = page.locator('#piiTypes');
    const typesText = await piiTypes.textContent();
    expect(parseInt(typesText || '0')).toBeGreaterThan(0);
  });

  test('displays redacted document with markers', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check redacted output
    const redactedOutput = page.locator('#redactedOutput');
    await expect(redactedOutput).toBeVisible();

    // Should contain redaction markers
    const markers = page.locator('.redaction-marker');
    const count = await markers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays redaction details table', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check redaction table
    const table = page.locator('#redactionTable');
    await expect(table).toBeVisible();

    // Should have rows in tbody
    const rows = page.locator('#redactionTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays confidence bars', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check confidence bars
    const bars = page.locator('.confidence-bar');
    const count = await bars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays sandbox note', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check sample note
    const sampleNote = page.locator('.sample-note');
    await expect(sampleNote).toBeVisible();
    await expect(sampleNote).toContainText(/Amazon Comprehend/i);
    await expect(sampleNote).toContainText(/85%/);
  });

  test('new document button resets UI', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete workflow
    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Click new document button
    await page.click('#newDocBtn');

    // Form should be visible again
    const formGroup = page.locator('.form-group');
    await expect(formGroup).toBeVisible();

    // Results should be hidden
    const results = page.locator('.results');
    await expect(results).not.toHaveClass(/visible/);

    // Textarea should be empty
    const textarea = page.locator('#textInput');
    const value = await textarea.inputValue();
    expect(value).toBe('');
  });
});

test.describe('FOI Redaction UI - Accessibility', () => {
  test('has no axe-core critical violations on page load', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#textInput');

    const results = await new AxeBuilder({ page })
      .exclude('.loading-spinner') // Exclude decorative spinner
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has no axe-core critical violations on results page', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    await page.click('#sampleBtn');
    await page.click('#redactBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has skip link', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const skipLink = page.locator('.skip-link, a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('textarea has proper label', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const label = page.locator('label[for="textInput"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText(/Document text/i);
  });

  test('loading area has aria-live', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const loading = page.locator('#loading');
    await expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  test('results area has aria-live', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);

    const results = page.locator('#results');
    await expect(results).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('FOI Redaction UI - Keyboard Navigation', () => {
  test('can tab to sample button', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Tab until we reach the sample button
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.id);
      if (focused === 'sampleBtn') break;
    }

    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('sampleBtn');
  });

  test('can activate sample button with Enter', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Focus sample button directly
    await page.focus('#sampleBtn');
    await page.keyboard.press('Enter');

    // Textarea should have content
    const textarea = page.locator('#textInput');
    await expect(textarea).not.toBeEmpty();
  });

  test('can activate sample button with Space', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Focus sample button directly
    await page.focus('#sampleBtn');
    await page.keyboard.press('Space');

    // Textarea should have content
    const textarea = page.locator('#textInput');
    await expect(textarea).not.toBeEmpty();
  });

  test('can tab to redact button after text entry', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Load sample first
    await page.click('#sampleBtn');

    // Tab to redact button
    await page.focus('#sampleBtn');
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('redactBtn');
  });
});

test.describe('FOI Redaction UI - API Integration', () => {
  test('GET request returns HTML', async ({ request }) => {
    const response = await request.get(FOI_REDACTION_URL);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<!DOCTYPE html>');
    expect(body).toContain('FOI Redaction');
  });

  test('POST request returns JSON with redactedText', async ({ request }) => {
    const response = await request.post(FOI_REDACTION_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: 'Contact John Smith at john.smith@email.com' },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('redactedText');
    expect(body.redactedText).toContain('[REDACTED:');
  });

  test('POST request returns JSON with redactions array', async ({ request }) => {
    const response = await request.post(FOI_REDACTION_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: 'Contact John Smith at john.smith@email.com or call 07700 900123' },
    });

    const body = await response.json();
    expect(body).toHaveProperty('redactions');
    expect(Array.isArray(body.redactions)).toBe(true);
    expect(body.redactions.length).toBeGreaterThan(0);

    // Check redaction structure
    const redaction = body.redactions[0];
    expect(redaction).toHaveProperty('type');
    expect(redaction).toHaveProperty('confidence');
  });

  test('POST request returns redaction count', async ({ request }) => {
    const response = await request.post(FOI_REDACTION_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: 'Contact John Smith at john.smith@email.com' },
    });

    const body = await response.json();
    expect(body).toHaveProperty('redactionCount');
    expect(body.redactionCount).toBeGreaterThan(0);
  });

  test('POST request returns confidence threshold', async ({ request }) => {
    const response = await request.post(FOI_REDACTION_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: 'Test text' },
    });

    const body = await response.json();
    expect(body).toHaveProperty('confidenceThreshold');
    expect(body.confidenceThreshold).toBe(0.85);
  });
});

test.describe('FOI Redaction UI - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#textInput');

    // Key elements visible
    const textarea = page.locator('#textInput');
    const sampleBtn = page.locator('#sampleBtn');

    await expect(textarea).toBeVisible();
    await expect(sampleBtn).toBeVisible();
  });

  test('redaction workflow works on mobile', async ({ page }) => {
    await page.goto(FOI_REDACTION_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete workflow
    await page.click('#sampleBtn');
    await page.click('#redactBtn');

    // Wait for results
    const results = page.locator('.results');
    await expect(results).toHaveClass(/visible/, { timeout: 30000 });
  });
});
