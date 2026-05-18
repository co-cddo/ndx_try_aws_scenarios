import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'smart-car-park',
  outputs: ['SmartCarParkDashboardURL', 'SmartCarParkSensorReadingsTable'],
  test: async ({ page, get }) => {
    const url = get('SmartCarParkDashboardURL');

    const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    expect(resp?.status(), 'public Lambda URL needs both InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl perms').not.toBe(403);

    // Dashboard renders Total Spaces / Available / Occupied. The simulator
    // Lambda publishes to DynamoDB every 2 min via EventBridge; the dashboard
    // Lambda reads + aggregates on each request. A zero "Total Spaces" means
    // either the DynamoDB scan failed or the simulator never seeded.
    await expect(page.locator('body')).toContainText(/Total Spaces/i);
    await expect(page.locator('body')).toContainText(/Occupied/i);
    const totals = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sv'))
        .map((e) => parseInt(e.textContent?.trim() ?? '', 10))
        .filter((n) => !Number.isNaN(n)),
    );
    expect(totals.length, 'dashboard rendered no numeric tiles — aggregation Lambda regression').toBeGreaterThan(0);
    expect(totals[0], 'dashboard "Total Spaces" is 0 — DynamoDB seed missing or simulator never ran').toBeGreaterThan(0);

    // Zone breakdown: at least 3 zones (Ground/L1/L2) should render with their
    // own occupancy stats. Missing zones = template regression in the dashboard
    // Lambda's HTML rendering.
    const zoneHeadings = await page.locator('h3', { hasText: /Ground Floor|Level [12]/ }).count();
    expect(zoneHeadings, 'zone breakdown missing — dashboard rendering regression').toBeGreaterThanOrEqual(3);
  },
});
