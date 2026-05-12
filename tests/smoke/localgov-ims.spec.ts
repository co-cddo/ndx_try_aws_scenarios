/**
 * LocalGov IMS smoke spec.
 *
 * Auth mode: admin-login (form-based, Windows EC2 + IIS).
 *
 * Bug-informed feature flow: the Windows-EC2-with-IIS architecture was
 * adopted on 2026-03-22 after Windows Fargate's http.sys multi-site
 * routing turned out to be broken (per localgov-ims-deploy-status
 * memory). The smoke spec verifies both the admin portal and the
 * payment portal respond on their respective IIS sites (different
 * ports, fronted by different CloudFront distributions). The login
 * form post catches the AdminPassword Lambda-custom-resource regression
 * (where dynamic Secrets Manager refs in CFN Outputs returned the
 * literal `{{resolve:...}}` token instead of the resolved value).
 */

import { test, expect } from '@playwright/test';

import {
  fetchStackOutputs,
  requireSafe,
  requireSensitive,
} from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'localgov-ims';

test.describe(SCENARIO, () => {
  test('admin portal + payment portal + login (Windows IIS multi-site)', async ({
    page,
  }) => {
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

    const adminUrl = requireSafe(outputs, 'LocalgovImsAdminPortalUrl');
    const paymentUrl = requireSafe(outputs, 'LocalgovImsPaymentPortalUrl');
    const adminUsername = requireSafe(outputs, 'LocalgovImsAdminUsername');
    const adminPassword = requireSensitive(outputs, 'LocalgovImsAdminPassword');

    // (a) Landing assertion: both portals reachable.
    await page.goto(adminUrl, { waitUntil: 'domcontentloaded' });
    expect(page.url(), 'admin portal redirect chain leaked').toContain(new URL(adminUrl).hostname);

    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded' });
    expect(page.url(), 'payment portal redirect chain leaked').toContain(new URL(paymentUrl).hostname);

    // The Lambda-custom-resource that resolves the admin password returned
    // the literal '{{resolve:secretsmanager:...}}' string at one point.
    // If the CFN output value still contains that string here, the resource
    // regressed.
    expect(adminPassword.sensitiveValue()).not.toMatch(/\{\{resolve:/);
    expect(adminUsername).not.toMatch(/\{\{resolve:/);

    // (b) Login on the admin portal.
    await page.goto(adminUrl, { waitUntil: 'domcontentloaded' });
    // IMS uses ASP.NET Identity; fields are usually #Email + #Password
    const userInput = page.locator('input[name="Email"], input[name="Username"], input#Email').first();
    await userInput.fill(adminUsername);
    await fillPassword(page, 'input[name="Password"], input#Password', adminPassword.sensitiveValue());
    await Promise.all([
      page.waitForURL((u) => !u.toString().toLowerCase().includes('login'), { timeout: 30_000 }),
      page.click('button[type="submit"], input[type="submit"]'),
    ]);

    // (c) Post-login: must reach an authenticated landing page.
    const body = await page.content();
    expect(body, 'admin login produced an error page').not.toMatch(/access denied|forbidden|unauthorized/i);
  });
});
