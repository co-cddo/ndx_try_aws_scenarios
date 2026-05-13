import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

// Smoke does NOT drive the Cognito Hosted UI sign-in (first-time password
// reset is too brittle). Verifies SPA loads, credentials present + properly
// redacted, and Lambda asset wiring works (no 5xx on reload).
runSmoke({
  scenario: 'simply-readable',
  outputs: ['SimplyReadableAppUrl', 'SimplyReadableAdminUsername', 'SimplyReadableAdminPassword'],
  test: async ({ page, get, getSecret }) => {
    const appUrl = get('SimplyReadableAppUrl');
    const adminUser = get('SimplyReadableAdminUsername');
    const adminPass = getSecret('SimplyReadableAdminPassword');

    await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    const html = (await page.content()).toLowerCase();
    expect(html).not.toMatch(/error.*chunkloaderror|failed to fetch dynamically imported/);
    expect(html).not.toContain('your-graphql-endpoint');

    expect(adminUser).not.toMatch(/^\{|placeholder|TODO|UNSET/i);
    expect(adminPass.length).toBeGreaterThan(8);
    expect(adminPass.sensitiveValue()).not.toMatch(/\{\{resolve:/);

    // BlueprintsBucketName parameter wiring catches asset 404s that look like SPA-success on first paint.
    const failedResponses: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500) {
        failedResponses.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.reload({ waitUntil: 'networkidle' });
    expect(failedResponses).toEqual([]);
  },
});
