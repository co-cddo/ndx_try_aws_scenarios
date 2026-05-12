/**
 * BOPS Planning smoke spec.
 *
 * Auth mode: admin-login (BOPS-web Devise sign-in form).
 *
 * Bug-informed feature flow: BOPS uses a Rails app behind nginx with
 * subdomain-aware routing. The CDK base64-encodes a routing.rb override
 * for single-tenant mode (BopsCore::Routing::BopsDomain / LocalAuthoritySubdomain
 * etc.). If the override doesn't reach the container or the boot script
 * fails the patch, all requests resolve to the Applicants subdomain
 * branch instead of the BOPS-web admin branch. Smoke verifies the
 * /users/sign_in form is reachable on the BOPS subdomain, login works,
 * and the post-login URL is on the admin (not applicants) host.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe, requireSensitive } from './fixtures/cfn-outputs';
import { fillPassword } from './fixtures/secure-form';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'bops-planning';

test.describe(SCENARIO, () => {
  test('BOPS web reachable + admin login + routing.rb single-tenant override', async ({ page }) => {
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

    const landingUrl = requireSafe(outputs, 'BopsPlanningUrl');
    const loginUrl = requireSafe(outputs, 'BopsPlanningLoginUrl');
    const adminUsername = requireSafe(outputs, 'BopsPlanningUsername');
    const adminPassword = requireSensitive(outputs, 'BopsPlanningPassword');

    // (a) Landing — BOPS web responds.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    const body = (await page.content()).toLowerCase();
    expect(body, 'BOPS web leaked Rails error page').not.toContain('we&#39;re sorry, but something went wrong');
    expect(body, 'BOPS routing.rb override missing — fell through to Applicants').not.toMatch(/applicants? portal/);

    // (b) Login.
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="user[email]"], input#user_email', adminUsername);
    await fillPassword(page, 'input[name="user[password]"], input#user_password', adminPassword.sensitiveValue());
    await Promise.all([
      page.waitForURL((u) => !u.toString().includes('sign_in'), { timeout: 30_000 }),
      page.click('input[name="commit"], button[type="submit"]'),
    ]);

    // (c) Post-login URL must be on the admin (BOPS) host, NOT applicants:8080.
    expect(page.url(), 'post-login URL leaked Applicants port :8080 — routing override regressed').not.toContain(':8080');
  });
});
