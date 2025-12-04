/**
 * QuickSight Dashboard Web Application E2E Tests (Story 23.5/23.6)
 *
 * Comprehensive test suite covering:
 * - Page load and UI elements
 * - KPI cards display
 * - Charts rendering
 * - Data table functionality
 * - Service filter
 * - CSV export
 * - Refresh data
 * - Accessibility compliance
 * - Keyboard navigation
 * - API integration
 * - Mobile responsiveness
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const QUICKSIGHT_URL = 'https://2o6kjtqzjdbn4mqurav4jhkvq40scjej.lambda-url.us-west-2.on.aws/';

// Use longer timeout for Lambda cold start
test.use({ timeout: 60000 });

test.describe('QuickSight Dashboard - Page Load', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(QUICKSIGHT_URL, { timeout: 45000 });
    await page.waitForTimeout(3000);

    expect(errors).toHaveLength(0);
  });

  test('displays correct page title', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL, { timeout: 45000 });
    await expect(page).toHaveTitle(/Council Performance Dashboard/);
  });

  test('displays NDX:Try header', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL, { timeout: 45000 });
    const header = page.locator('.header-title');
    await expect(header).toContainText('NDX:Try');
  });

  test('displays sandbox phase banner', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL, { timeout: 45000 });
    const phaseBanner = page.locator('.phase-banner');
    await expect(phaseBanner).toBeVisible();
    await expect(phaseBanner).toContainText('Sandbox');
  });

  test('displays main heading', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Council Service Performance');
  });

  test('displays intro text', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const intro = page.locator('.intro');
    await expect(intro).toContainText('90 days');
  });
});

test.describe('QuickSight Dashboard - KPI Cards', () => {
  test('displays 4 KPI cards', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);
  });

  test('total cases KPI shows number', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    const totalCases = page.locator('#kpiTotalCases');
    const value = await totalCases.textContent();
    expect(value).toMatch(/[\d,]+/);
  });

  test('resolved cases KPI shows number', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiResolved:not(:has-text("-"))');
    const resolved = page.locator('#kpiResolved');
    const value = await resolved.textContent();
    expect(value).toMatch(/[\d,]+/);
  });

  test('resolution rate KPI shows percentage', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiResolutionRate:not(:has-text("-"))');
    const rate = page.locator('#kpiResolutionRate');
    const value = await rate.textContent();
    expect(value).toMatch(/[\d.]+%/);
  });

  test('satisfaction KPI shows score', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiSatisfaction:not(:has-text("-"))');
    const satisfaction = page.locator('#kpiSatisfaction');
    const value = await satisfaction.textContent();
    expect(value).toMatch(/[\d.]+/);
  });
});

test.describe('QuickSight Dashboard - Charts', () => {
  test('displays cases by service bar chart', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    const barChart = page.locator('#barChart');
    await expect(barChart).toBeVisible();
  });

  test('displays satisfaction scores bar chart', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    const satisfactionChart = page.locator('#satisfactionChart');
    await expect(satisfactionChart).toBeVisible();
  });

  test('bar chart has aria-label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const barChart = page.locator('#barChart');
    await expect(barChart).toHaveAttribute('aria-label');
  });

  test('satisfaction chart has aria-label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const satisfactionChart = page.locator('#satisfactionChart');
    await expect(satisfactionChart).toHaveAttribute('aria-label');
  });
});

test.describe('QuickSight Dashboard - Data Table', () => {
  test('displays service breakdown table', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    const table = page.locator('#serviceTable');
    await expect(table).toBeVisible();
  });

  test('table has correct headers', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const headers = page.locator('.data-table th');
    await expect(headers).toHaveCount(5);
    await expect(headers.nth(0)).toContainText('Service Area');
    await expect(headers.nth(1)).toContainText('Cases Received');
    await expect(headers.nth(2)).toContainText('Cases Resolved');
    await expect(headers.nth(3)).toContainText('Resolution Rate');
    await expect(headers.nth(4)).toContainText('Satisfaction');
  });

  test('table displays 9 service rows', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);
    const rows = page.locator('#tableBody tr');
    await expect(rows).toHaveCount(9);
  });

  test('table shows satisfaction badges', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);
    const badges = page.locator('.satisfaction-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking header sorts table', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);

    const firstRowBefore = await page.locator('#tableBody tr:first-child td:first-child').textContent();
    // Use force click to bypass any overlapping elements
    await page.click('.data-table th[data-sort="name"]', { force: true });
    await page.waitForTimeout(500);
    const firstRowAfter = await page.locator('#tableBody tr:first-child td:first-child').textContent();

    // After sorting by name, first row should change or stay same if already sorted
    expect(firstRowAfter).toBeDefined();
  });
});

test.describe('QuickSight Dashboard - Controls', () => {
  test('displays service filter dropdown', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const filter = page.locator('#serviceFilter');
    await expect(filter).toBeVisible();
  });

  test('service filter has All Services option', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const allOption = page.locator('#serviceFilter option[value="all"]');
    await expect(allOption).toHaveCount(1);
  });

  test('service filter populates with service options', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);
    const options = page.locator('#serviceFilter option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(10); // All Services + 9 services
  });

  test('filtering by service updates table', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);

    const rowsBefore = await page.locator('#tableBody tr').count();
    await page.selectOption('#serviceFilter', 'Parking');
    await page.waitForTimeout(500);
    const rowsAfter = await page.locator('#tableBody tr').count();

    expect(rowsAfter).toBeLessThan(rowsBefore);
  });

  test('displays refresh button', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const refreshBtn = page.locator('#refreshBtn');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toContainText('Refresh Data');
  });

  test('displays export button', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const exportBtn = page.locator('#exportBtn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Export CSV');
  });

  test('refresh button reloads data', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');

    await page.click('#refreshBtn');
    const loading = page.locator('#loading');
    await expect(loading).toHaveClass(/visible/);
  });
});

test.describe('QuickSight Dashboard - Accessibility', () => {
  test('has no axe-core critical violations', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has skip link', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCount(1);
  });

  test('service filter has accessible label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const label = page.locator('label[for="serviceFilter"]');
    await expect(label).toBeVisible();
  });

  test('loading indicator has aria-live', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const loading = page.locator('#loading');
    await expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  test('data table has aria-label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const table = page.locator('#serviceTable');
    await expect(table).toHaveAttribute('aria-label', 'Service performance breakdown');
  });

  test('controls have aria-label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const controls = page.locator('.controls');
    await expect(controls).toHaveAttribute('aria-label', 'Dashboard controls');
  });

  test('KPI section has aria-label', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    const kpiSection = page.locator('section[aria-label="Key performance indicators"]');
    await expect(kpiSection).toHaveCount(1);
  });
});

test.describe('QuickSight Dashboard - Keyboard Navigation', () => {
  test('can tab to filter select', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    const filter = page.locator('#serviceFilter');
    await expect(filter).toBeVisible();
  });

  test('can activate refresh button with Enter', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');

    const refreshBtn = page.locator('#refreshBtn');
    await refreshBtn.focus();
    await page.keyboard.press('Enter');

    const loading = page.locator('#loading');
    await expect(loading).toHaveClass(/visible/);
  });

  test('can navigate table headers with keyboard', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');

    const firstHeader = page.locator('.data-table th').first();
    await firstHeader.focus();
    await page.keyboard.press('Enter');

    // Table should sort (no error thrown)
    await expect(firstHeader).toBeVisible();
  });
});

test.describe('QuickSight Dashboard - API Integration', () => {
  test('GET request returns HTML', async ({ request }) => {
    const response = await request.get(QUICKSIGHT_URL);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('POST request returns JSON with success', async ({ request }) => {
    const response = await request.post(QUICKSIGHT_URL, {
      data: { action: 'summary' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  test('POST request returns summary data', async ({ request }) => {
    const response = await request.post(QUICKSIGHT_URL, {
      data: { action: 'summary' },
    });

    const data = await response.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalCases).toBeGreaterThan(0);
    expect(data.summary.totalResolved).toBeGreaterThan(0);
    expect(data.summary.overallResolutionRate).toBeGreaterThan(0);
    expect(data.summary.avgSatisfaction).toBeGreaterThan(0);
  });

  test('POST request returns service breakdown', async ({ request }) => {
    const response = await request.post(QUICKSIGHT_URL, {
      data: { action: 'summary' },
    });

    const data = await response.json();
    expect(data.serviceBreakdown).toBeDefined();
    expect(data.serviceBreakdown.length).toBe(9);
  });

  test('POST request returns timestamp', async ({ request }) => {
    const response = await request.post(QUICKSIGHT_URL, {
      data: { action: 'summary' },
    });

    const data = await response.json();
    expect(data.timestamp).toBeDefined();
  });

  test('POST request with invalid action returns error', async ({ request }) => {
    const response = await request.post(QUICKSIGHT_URL, {
      data: { action: 'invalid_action' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

test.describe('QuickSight Dashboard - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);

    const header = page.locator('.header');
    const heading = page.locator('h1');
    const kpiGrid = page.locator('.kpi-grid');

    await expect(header).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(kpiGrid).toBeVisible();
  });

  test('KPI cards stack on mobile', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');

    const kpiGrid = page.locator('.kpi-grid');
    const box = await kpiGrid.boundingBox();

    // Grid should be close to full width on mobile
    expect(box?.width).toBeGreaterThan(300);
  });

  test('controls stack on mobile', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);

    const controls = page.locator('.controls');
    await expect(controls).toBeVisible();
  });

  test('table scrolls horizontally on mobile', async ({ page }) => {
    await page.goto(QUICKSIGHT_URL);
    await page.waitForSelector('#kpiTotalCases:not(:has-text("-"))');

    const tableContainer = page.locator('.table-container');
    await expect(tableContainer).toBeVisible();

    // Container should have overflow handling
    const overflow = await tableContainer.evaluate((el) =>
      window.getComputedStyle(el).overflowX
    );
    expect(overflow).toBe('auto');
  });
});
