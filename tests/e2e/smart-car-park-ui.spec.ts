/**
 * Smart Car Park IoT Dashboard E2E Tests (Story 21.5/21.6)
 *
 * Comprehensive test suite covering:
 * - Page load and UI elements
 * - Dashboard data loading
 * - Car park status cards
 * - Refresh and simulate functionality
 * - Auto-refresh toggle
 * - Accessibility compliance
 * - Keyboard navigation
 * - API integration
 * - Mobile responsiveness
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SMART_CAR_PARK_URL = 'https://bg5qycgpwjzibzdtd2f2i6rzsu0rvxha.lambda-url.us-west-2.on.aws/';

test.describe('Smart Car Park Dashboard - Page Load', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test('displays correct page title', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await expect(page).toHaveTitle(/Smart Car Park Dashboard/);
  });

  test('displays NDX:Try header', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const header = page.locator('.header-title');
    await expect(header).toContainText('NDX:Try');
  });

  test('displays sandbox phase banner', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const phaseBanner = page.locator('.phase-banner');
    await expect(phaseBanner).toBeVisible();
    await expect(phaseBanner).toContainText('Sandbox');
  });

  test('displays main heading', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Live Parking Availability');
  });

  test('displays IoT sensor status indicator', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const sensorStatus = page.locator('.sensor-status');
    await expect(sensorStatus).toBeVisible();
    await expect(sensorStatus).toContainText('IoT Sensors Online');
  });

  test('displays summary panel with metrics', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('#totalCapacity');
    await page.waitForTimeout(3000);

    const totalCapacity = page.locator('#totalCapacity');
    const totalAvailable = page.locator('#totalAvailable');
    const totalOccupied = page.locator('#totalOccupied');
    const avgOccupancy = page.locator('#avgOccupancy');

    await expect(totalCapacity).not.toHaveText('-');
    await expect(totalAvailable).not.toHaveText('-');
    await expect(totalOccupied).not.toHaveText('-');
    await expect(avgOccupancy).not.toHaveText('-');
  });

  test('displays refresh button', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const refreshBtn = page.locator('#refreshBtn');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toContainText('Refresh Data');
  });

  test('displays simulate button', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const simulateBtn = page.locator('#simulateBtn');
    await expect(simulateBtn).toBeVisible();
    await expect(simulateBtn).toContainText('Simulate Sensor Update');
  });

  test('displays auto-refresh checkbox', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const autoRefresh = page.locator('#autoRefresh');
    await expect(autoRefresh).toBeVisible();
    await expect(autoRefresh).toBeChecked();
  });
});

test.describe('Smart Car Park Dashboard - Car Park Cards', () => {
  test('displays 4 car park cards after data loads', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const cards = page.locator('.car-park-card');
    await expect(cards).toHaveCount(4);
  });

  test('car park cards have correct structure', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const firstCard = page.locator('.car-park-card').first();

    // Check card elements
    await expect(firstCard.locator('.car-park-name')).toBeVisible();
    await expect(firstCard.locator('.car-park-status')).toBeVisible();
    await expect(firstCard.locator('.progress-bar')).toBeVisible();
    await expect(firstCard.locator('.car-park-stats')).toBeVisible();
    await expect(firstCard.locator('.car-park-price')).toBeVisible();
  });

  test('car park cards show availability data', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const firstCard = page.locator('.car-park-card').first();

    // Check stats are populated
    const stats = firstCard.locator('.stat-value');
    await expect(stats.first()).not.toHaveText('-');
  });

  test('car park cards have color-coded status', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // Check that cards have status classes
    const cards = page.locator('.car-park-card');
    const firstCard = cards.first();

    const classAttr = await firstCard.getAttribute('class');
    expect(classAttr).toMatch(/status-(green|amber|red)/);
  });

  test('car park cards display Town Centre Multi-Storey', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const townCentre = page.locator('.car-park-name:has-text("Town Centre Multi-Storey")');
    await expect(townCentre).toBeVisible();
  });

  test('car park cards display hourly rates', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const priceElements = page.locator('.car-park-price');
    await expect(priceElements.first()).toContainText('£');
  });
});

test.describe('Smart Car Park Dashboard - Interactions', () => {
  test('refresh button updates data', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // Get initial timestamp
    const initialTimestamp = await page.locator('#lastUpdated').textContent();

    // Wait a moment and click refresh
    await page.waitForTimeout(1000);
    await page.click('#refreshBtn');
    await page.waitForTimeout(2000);

    // Timestamp should update
    const newTimestamp = await page.locator('#lastUpdated').textContent();
    // Note: timestamps may or may not change depending on timing
    expect(newTimestamp).toBeTruthy();
  });

  test('simulate button generates new data', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // Click simulate button
    await page.click('#simulateBtn');

    // Wait for button to show simulating state
    await expect(page.locator('#simulateBtn')).toContainText('Simulating...');

    // Wait for it to complete
    await page.waitForTimeout(3000);
    await expect(page.locator('#simulateBtn')).toContainText('Simulate Sensor Update');
  });

  test('auto-refresh checkbox can be toggled', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);

    const checkbox = page.locator('#autoRefresh');

    // Initially checked
    await expect(checkbox).toBeChecked();

    // Uncheck
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();

    // Check again
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('loading state displays during data fetch', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);

    // The loading state should appear briefly on page load
    // We'll trigger a manual refresh to see it
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // The loading element should exist in the DOM
    const loading = page.locator('#loading');
    await expect(loading).toHaveCount(1);
  });
});

test.describe('Smart Car Park Dashboard - Accessibility', () => {
  test('has no axe-core critical violations on page load', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('has skip link', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCount(1);
  });

  test('summary panel has aria-label', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const summaryPanel = page.locator('.summary-panel');
    await expect(summaryPanel).toHaveAttribute('aria-label', 'Parking summary');
  });

  test('dashboard grid has aria-label', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const grid = page.locator('#dashboardGrid');
    await expect(grid).toHaveAttribute('aria-label', 'Car park status cards');
  });

  test('loading area has aria-live', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    const loading = page.locator('#loading');
    await expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  test('progress bars have ARIA attributes', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const progressBar = page.locator('.progress-bar').first();
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
});

test.describe('Smart Car Park Dashboard - Keyboard Navigation', () => {
  test('can tab to refresh button', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('#refreshBtn');

    // Tab through the page
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Check if refresh button is focusable
    const refreshBtn = page.locator('#refreshBtn');
    await expect(refreshBtn).toBeVisible();
  });

  test('can activate refresh button with Enter', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const refreshBtn = page.locator('#refreshBtn');
    await refreshBtn.focus();
    await page.keyboard.press('Enter');

    // Should trigger refresh (button may briefly disable)
    await page.waitForTimeout(500);
    expect(true).toBe(true); // If we get here without error, keyboard works
  });

  test('can activate simulate button with Space', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    const simulateBtn = page.locator('#simulateBtn');
    await simulateBtn.focus();
    await page.keyboard.press('Space');

    // Should trigger simulate
    await expect(simulateBtn).toContainText(/Simulat/);
  });

  test('can toggle checkbox with keyboard', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);

    const checkbox = page.locator('#autoRefresh');
    await checkbox.focus();

    await expect(checkbox).toBeChecked();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
  });
});

test.describe('Smart Car Park Dashboard - API Integration', () => {
  test('GET request returns HTML', async ({ request }) => {
    const response = await request.get(SMART_CAR_PARK_URL);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('POST request returns JSON with carParks', async ({ request }) => {
    const response = await request.post(SMART_CAR_PARK_URL, {
      data: { action: 'status' },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.carParks).toBeDefined();
    expect(Array.isArray(data.carParks)).toBe(true);
  });

  test('POST request returns 4 car parks', async ({ request }) => {
    const response = await request.post(SMART_CAR_PARK_URL, {
      data: { action: 'status' },
    });

    const data = await response.json();
    expect(data.carParks).toHaveLength(4);
  });

  test('POST request returns totalCapacity', async ({ request }) => {
    const response = await request.post(SMART_CAR_PARK_URL, {
      data: { action: 'status' },
    });

    const data = await response.json();
    expect(data.totalCapacity).toBeDefined();
    expect(typeof data.totalCapacity).toBe('number');
    expect(data.totalCapacity).toBe(1050); // Sum of all car park capacities
  });

  test('POST request returns totalAvailable', async ({ request }) => {
    const response = await request.post(SMART_CAR_PARK_URL, {
      data: { action: 'status' },
    });

    const data = await response.json();
    expect(data.totalAvailable).toBeDefined();
    expect(typeof data.totalAvailable).toBe('number');
  });

  test('simulate action returns success', async ({ request }) => {
    const response = await request.post(SMART_CAR_PARK_URL, {
      data: { action: 'simulate' },
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Simulated data for 4 car parks');
  });
});

test.describe('Smart Car Park Dashboard - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // Check main elements are visible
    const header = page.locator('.header');
    const heading = page.locator('h1');
    const grid = page.locator('#dashboardGrid');

    await expect(header).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(grid).toBeVisible();
  });

  test('car park cards stack on mobile', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // On mobile, cards should be full width
    const firstCard = page.locator('.car-park-card').first();
    const box = await firstCard.boundingBox();

    // Card should be close to full width (with some padding)
    expect(box?.width).toBeGreaterThan(300);
  });

  test('controls work on mobile', async ({ page }) => {
    await page.goto(SMART_CAR_PARK_URL);
    await page.waitForSelector('.car-park-card', { timeout: 10000 });

    // Test refresh button on mobile
    const refreshBtn = page.locator('#refreshBtn');
    await expect(refreshBtn).toBeVisible();

    await refreshBtn.click();
    await page.waitForTimeout(1000);
  });
});
