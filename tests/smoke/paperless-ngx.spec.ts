/**
 * Paperless-ngx smoke spec.
 *
 * Auth mode: admin-login (Paperless's built-in login form).
 *
 * Bug-informed feature flow: per memory feedback_s3files_quirks, this
 * scenario uses S3 Files (formerly known as the "mountpoint" pattern).
 * The deploy creates a versioned bucket, EFS service principal, nested
 * fsap- ARN, EventBridge perms. Smoke verifies the SPA loads, the admin
 * login works, and the Documents view renders (which depends on the S3
 * Files mount being healthy — if EFS access points or the inline KB
 * Lambda registration regress, Documents won't render).
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe, requireSensitive } from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'paperless-ngx';

test.describe(SCENARIO, () => {
  test('landing + login + Documents view (S3 Files mount integrity)', async ({ page }) => {
    const row = requireAssertionBar(SCENARIO);
    if (row.quarantine.state === 'quarantined') {
      test.skip(true, `Quarantined until ${row.quarantine.until}: ${row.quarantine.reason}`);
    }

    const outputs = await fetchStackOutputs({
      stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
      region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
    });

    for (const key of row.outputsToCheck) {
      expect(outputs[key], `CFN output ${key} missing`).toBeDefined();
    }

    const landingUrl = requireSafe(outputs, 'PaperlessNgxUrl');
    const adminUsername = requireSafe(outputs, 'PaperlessNgxAdminUsername');
    const adminPassword = requireSensitive(outputs, 'PaperlessNgxAdminPassword');

    // (a) Landing — login page renders.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="username"], input#username', { timeout: 30_000 });

    // (b) Login.
    await page.fill('input[name="username"], input#username', adminUsername);
    await fillPassword(page, 'input[name="password"], input#password', adminPassword.sensitiveValue());
    await Promise.all([
      page.waitForURL((u) => !u.toString().includes('login'), { timeout: 30_000 }),
      page.click('button[type="submit"], input[type="submit"]'),
    ]);

    // (c) Documents view. Paperless's Angular SPA fetches /api/documents/.
    //     If the S3 Files mount or the underlying Postgres tables are broken,
    //     this request returns 500.
    await page.goto(`${landingUrl.replace(/\/$/, '')}/documents`, { waitUntil: 'domcontentloaded' });
    const apiResp = await page.evaluate(async () => {
      try {
        const r = await fetch(window.location.origin + '/api/documents/?page=1', {
          credentials: 'same-origin',
        });
        return r.status;
      } catch {
        return -1;
      }
    });
    expect(apiResp, '/api/documents/ failed — S3 Files mount or DB regressed').toBeGreaterThan(0);
    expect(apiResp, '/api/documents/ 5xx').toBeLessThan(500);
  });
});
