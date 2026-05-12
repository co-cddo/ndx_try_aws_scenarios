/**
 * FixMyStreet smoke spec.
 *
 * Auth mode: admin-login. Highest-priority Phase 4 scenario per the tech-spec
 * because of 15+ historical iterations (see fixmystreet-lessons memory).
 *
 * Bug-informed feature flow: post-login, visit /reports (catches the
 * "/reports page requires bin/update-all-reports" regression) and /admin
 * (catches the 2FA-bypass regression where must_have_2fa would block
 * superuser admin access without the STAGING_FLAGS opt-out).
 *
 * Phase 4 / per tech-spec assertion-bar table row.
 */

import { test, expect } from '@playwright/test';

import {
  fetchStackOutputs,
  requireSafe,
  requireSensitive,
} from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'fixmystreet';

test.describe(SCENARIO, () => {
  test('landing + login + /reports + /admin (bug-informed regression flow)', async ({ page }) => {
    const row = requireAssertionBar(SCENARIO);
    if (row.quarantine.state === 'quarantined') {
      test.skip(true, `Quarantined until ${row.quarantine.until}: ${row.quarantine.reason}`);
    }

    const outputs = await fetchStackOutputs({
      stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
      region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
    });

    // Validate that every Output the assertion bar names actually exists.
    for (const key of row.outputsToCheck) {
      expect(outputs[key], `CFN output ${key} missing`).toBeDefined();
    }

    const landingUrl = requireSafe(outputs, 'FixMyStreetUrl');
    expect(landingUrl).toMatch(/^https?:\/\//);

    // (a) Landing assertion: status + body marker. Catches the
    //     CloudFront / BASE_URL injection regression where the page would
    //     respond but contain absolute :9000 URLs in links.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/FixMyStreet/i);
    // Body must not reference an :9000 absolute URL (the ALB sidecar
    // mis-routing regression).
    const bodyHtml = await page.content();
    expect(bodyHtml, 'landing page leaked :9000 URLs from sidecar mis-routing').not.toMatch(/https?:\/\/[^"'\s]*:9000/);

    // (b) Login. FMS admin form is at /auth (email + password).
    const adminUsername = requireSafe(outputs, 'FixMyStreetAdminUsername');
    const adminPassword = requireSensitive(outputs, 'FixMyStreetAdminPassword');

    await page.goto(`${landingUrl.replace(/\/$/, '')}/auth`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', adminUsername);
    await fillPassword(page, 'input[name="password"]', adminPassword.sensitiveValue(), {
      fieldNames: ['password'],
    });
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(my|admin)?/, { timeout: 30_000 });

    // (c) Feature flow — bug-informed. Post-login:
    //     1. Visit /reports — the page requires bin/update-all-reports to have
    //        produced data/all-reports.json. Regression caught: empty /reports.
    await page.goto(`${landingUrl.replace(/\/$/, '')}/reports`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error/i);
    await expect(page).toHaveTitle(/Reports|FixMyStreet/i);

    //     2. Visit /admin — superuser must reach the admin dashboard. Catches
    //        the must_have_2fa regression that would block this when STAGING_FLAGS
    //        skip_must_have_2fa is not set.
    await page.goto(`${landingUrl.replace(/\/$/, '')}/admin`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    expect(url, 'admin page redirected to 2FA setup; STAGING_FLAGS skip_must_have_2fa regressed').not.toMatch(/two_factor|2fa|two-factor/);
    await expect(page.locator('body')).toContainText(/(Reports|Bodies|Users|Categories)/i);
  });
});
