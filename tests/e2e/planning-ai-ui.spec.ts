/**
 * Planning AI UI E2E Tests (Story 19.6)
 *
 * Comprehensive tests for the Planning AI web application covering:
 * - Page load and initial state
 * - File upload interface
 * - Sample document workflow
 * - Results display
 * - Accessibility (axe-core)
 * - Keyboard navigation
 *
 * Prerequisites:
 * - ndx-try-planning-ai stack deployed in us-west-2
 *
 * Usage:
 *   npx playwright test tests/e2e/planning-ai-ui.spec.ts
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PLANNING_AI_URL = 'https://zh7vdzicwrc2aiqx4s6cypcwfu0qcmus.lambda-url.us-west-2.on.aws/';

test.describe('Planning AI UI - Page Load', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(PLANNING_AI_URL);
    await page.waitForLoadState('domcontentloaded');

    expect(errors).toHaveLength(0);
  });

  test('displays correct page title', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await expect(page).toHaveTitle(/Planning Application AI/);
  });

  test('displays NDX:Try header', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const header = page.locator('.header, header');
    await expect(header.first()).toContainText(/NDX/i);
    await expect(header.first()).toContainText(/Planning Application AI/i);
  });

  test('displays sandbox phase banner', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const phaseBanner = page.locator('.phase-banner');
    await expect(phaseBanner).toBeVisible();
    await expect(phaseBanner).toContainText(/Sandbox/i);
  });

  test('displays upload zone', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const uploadZone = page.locator('.upload-zone, #uploadZone');
    await expect(uploadZone).toBeVisible();
    await expect(uploadZone).toContainText(/Drag and drop/i);
  });

  test('displays file input and choose button', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const fileInput = page.locator('#fileInput, input[type="file"]');
    const chooseBtn = page.locator('.file-label');

    await expect(fileInput).toBeAttached();
    await expect(chooseBtn).toBeVisible();
    await expect(chooseBtn).toContainText(/Choose file/i);
  });

  test('displays sample document button', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const sampleBtn = page.locator('#sampleBtn');
    await expect(sampleBtn).toBeVisible();
    await expect(sampleBtn).toContainText(/Use Sample Document/i);
  });
});

test.describe('Planning AI UI - Upload Workflow', () => {
  test('sample document button shows file info', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Click sample document button
    await page.click('#sampleBtn');

    // File info should become visible
    const fileInfo = page.locator('.file-info');
    await expect(fileInfo).toHaveClass(/visible/);
    await expect(fileInfo).toContainText(/sample-planning-application/i);
  });

  test('analyze button appears after sample selection', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Initially analyze button is hidden
    const analyzeBtn = page.locator('#analyzeBtn');
    await expect(analyzeBtn).not.toHaveClass(/visible/);

    // Click sample document button
    await page.click('#sampleBtn');

    // Analyze button should become visible
    await expect(analyzeBtn).toHaveClass(/visible/);
  });

  test('upload zone changes style when sample selected', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    const uploadZone = page.locator('.upload-zone');
    await expect(uploadZone).not.toHaveClass(/has-file/);

    // Click sample document button
    await page.click('#sampleBtn');

    // Upload zone should have has-file class
    await expect(uploadZone).toHaveClass(/has-file/);
  });
});

test.describe('Planning AI UI - Analysis Flow', () => {
  test('shows loading state during analysis', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Select sample and analyze
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');

    // Loading should be visible
    const loading = page.locator('.loading');
    await expect(loading).toHaveClass(/visible/, { timeout: 5000 });
    await expect(loading).toContainText(/Analyzing document/i);
  });

  test('hides upload zone during analysis', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Select sample and analyze
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');

    // Upload zone should be hidden
    const uploadZone = page.locator('.upload-zone');
    await expect(uploadZone).toBeHidden({ timeout: 5000 });
  });

  test('displays results after analysis', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');

    // Wait for results
    const results = page.locator('.results');
    await expect(results).toHaveClass(/visible/, { timeout: 30000 });
    await expect(results).toContainText(/Analysis Results/i);
  });

  test('displays extracted data fields', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check extracted data
    const extractedData = page.locator('.extracted-data');
    await expect(extractedData).toContainText(/PA\/2024\/00123/); // Application ref
    await expect(extractedData).toContainText(/Mr John Smith/); // Applicant
    await expect(extractedData).toContainText(/45 Oak Street/); // Address
    await expect(extractedData).toContainText(/Householder Application/); // Type
  });

  test('displays analysis recommendation badge', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');
    await page.waitForSelector('.recommendation', { timeout: 30000 });

    // Check recommendation
    const recommendation = page.locator('.recommendation');
    await expect(recommendation).toBeVisible();
    await expect(recommendation).toContainText(/APPROVE/i);
  });

  test('displays issues and recommendations lists', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check issues list
    const issuesList = page.locator('.issues-list');
    await expect(issuesList).toBeVisible();

    // Check recommendations list
    const recsList = page.locator('.recommendations-list');
    await expect(recsList).toBeVisible();
  });

  test('displays sandbox note', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    // Check sandbox note
    const sampleNote = page.locator('.sample-note');
    await expect(sampleNote).toBeVisible();
    await expect(sampleNote).toContainText(/sandbox demonstration/i);
    await expect(sampleNote).toContainText(/Amazon Textract/i);
  });
});

test.describe('Planning AI UI - Accessibility', () => {
  test('has no axe-core critical violations on page load', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('.upload-zone');

    const results = await new AxeBuilder({ page })
      .exclude('.loading-spinner') // Exclude decorative spinner
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has no axe-core critical violations on results page', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');
    await page.waitForSelector('.results.visible', { timeout: 30000 });

    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has skip link', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const skipLink = page.locator('.skip-link, a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('upload zone has ARIA attributes', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const uploadZone = page.locator('.upload-zone, #uploadZone');
    await expect(uploadZone).toHaveAttribute('role', 'region');
    await expect(uploadZone).toHaveAttribute('aria-label', /upload/i);
  });

  test('loading area has aria-live', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const loading = page.locator('.loading, #loading');
    await expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  test('results area has aria-live', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);

    const results = page.locator('.results, #results');
    await expect(results).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('Planning AI UI - Keyboard Navigation', () => {
  test('can tab to sample button', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
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
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Focus sample button directly
    await page.focus('#sampleBtn');
    await page.keyboard.press('Enter');

    // File info should be visible
    const fileInfo = page.locator('.file-info');
    await expect(fileInfo).toHaveClass(/visible/);
  });

  test('can activate sample button with Space', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Focus sample button directly
    await page.focus('#sampleBtn');
    await page.keyboard.press('Space');

    // File info should be visible
    const fileInfo = page.locator('.file-info');
    await expect(fileInfo).toHaveClass(/visible/);
  });
});

test.describe('Planning AI UI - API Integration', () => {
  test('GET request returns HTML', async ({ request }) => {
    const response = await request.get(PLANNING_AI_URL);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<!DOCTYPE html>');
    expect(body).toContain('Planning Application AI');
  });

  test('POST request returns JSON with extractedData', async ({ request }) => {
    const response = await request.post(PLANNING_AI_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { filename: 'sample.pdf' },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('extractedData');
    expect(body.extractedData).toHaveProperty('applicationRef');
    expect(body.extractedData).toHaveProperty('applicantName');
    expect(body.extractedData).toHaveProperty('siteAddress');
  });

  test('POST request returns JSON with analysis', async ({ request }) => {
    const response = await request.post(PLANNING_AI_URL, {
      headers: { 'Content-Type': 'application/json' },
      data: { filename: 'sample.pdf' },
    });

    const body = await response.json();
    expect(body).toHaveProperty('analysis');
    expect(body.analysis).toHaveProperty('overallRecommendation');
    expect(body.analysis).toHaveProperty('rationale');
    expect(body.analysis).toHaveProperty('potentialIssues');
    expect(body.analysis).toHaveProperty('recommendations');
  });
});

test.describe('Planning AI UI - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('.upload-zone');

    // Key elements visible
    const uploadZone = page.locator('.upload-zone');
    const sampleBtn = page.locator('#sampleBtn');

    await expect(uploadZone).toBeVisible();
    await expect(sampleBtn).toBeVisible();
  });

  test('analysis workflow works on mobile', async ({ page }) => {
    await page.goto(PLANNING_AI_URL);
    await page.waitForSelector('#sampleBtn');

    // Complete analysis workflow
    await page.click('#sampleBtn');
    await page.click('#analyzeBtn');

    // Wait for results
    const results = page.locator('.results');
    await expect(results).toHaveClass(/visible/, { timeout: 30000 });
  });
});
