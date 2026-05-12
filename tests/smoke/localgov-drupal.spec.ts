/**
 * LocalGov Drupal smoke spec.
 *
 * Auth mode: admin-login (Drupal /user/login form).
 *
 * Bug-informed feature flow: Drupal startup is sensitive to AWS-Bedrock
 * connectivity (the ndx_aws_ai module bootstraps Bedrock clients at
 * cache:bin construction). The smoke spec exercises the admin login
 * and visits the dashboard, which exercises the ndx_aws_ai code path
 * that's known to break when Bedrock model access is regressed
 * (the same legacy claude-3-haiku migration that's tracked under
 * NAP-548).
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe, requireSensitive } from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'localgov-drupal';

test.describe(SCENARIO, () => {
  test('landing + login + admin dashboard (ndx_aws_ai integrity)', async ({ page }) => {
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

    const landingUrl = requireSafe(outputs, 'DrupalUrl');
    const adminUsername = requireSafe(outputs, 'DrupalAdminUsername');
    const adminPassword = requireSensitive(outputs, 'DrupalAdminPassword');

    // (a) Landing.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/.+/);
    const html = (await page.content()).toLowerCase();
    expect(html, 'PHP fatal leaked to the response').not.toContain('fatal error');
    expect(html, 'Bedrock boot error leaked to the response').not.toContain('accessdeniedexception');

    // (b) Login.
    await page.goto(`${landingUrl.replace(/\/$/, '')}/user/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', adminUsername);
    await fillPassword(page, 'input[name="pass"]', adminPassword.sensitiveValue(), { fieldNames: ['pass', 'password'] });
    await Promise.all([
      page.waitForURL((u) => !u.toString().includes('/user/login'), { timeout: 30_000 }),
      page.click('input[type="submit"], button[type="submit"]'),
    ]);

    // (c) Admin dashboard reachable; no module-boot failures.
    await page.goto(`${landingUrl.replace(/\/$/, '')}/admin`, { waitUntil: 'domcontentloaded' });
    const adminBody = (await page.content()).toLowerCase();
    expect(adminBody, 'admin page leaked Bedrock access error').not.toContain('accessdeniedexception');
    expect(adminBody, 'admin page leaked module-rebuild error').not.toMatch(/module .* could not be enabled/);
  });
});
