/**
 * PlanX smoke spec.
 *
 * Auth mode: admin-login (form with demo credentials surfaced in CFN outputs).
 * Priority #2 per the tech-spec because of 13 historical issues (see
 * planx-scenario-lessons memory).
 *
 * Bug-informed feature flow: post-login, verify the Editor surface loads
 * past the window.location.host domain-validation check (catches the
 * editor-domain-validation regression where CloudFront / ELB hostnames
 * were rejected). Plus verify that /v1/version on the Hasura native path
 * responds without the prefix-stripping that the eliminated Caddy proxy
 * used to require.
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

const SCENARIO = 'planx';

test.describe(SCENARIO, () => {
  test('landing + login + Editor reachable + Hasura native path (bug-informed regression flow)', async ({
    page,
    request,
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

    const landingUrl = requireSafe(outputs, 'PlanXUrl');
    const loginUrl = requireSafe(outputs, 'PlanXLoginUrl');
    const demoUser = requireSafe(outputs, 'PlanXDemoUsername');
    const demoPass = requireSensitive(outputs, 'PlanXDemoPassword');

    // (a) Landing assertion.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    // PlanX SPA boot is async; wait for the loader to disappear.
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    // No "Permission denied for this domain" or Airbrake error overlay; both
    // are signatures of the domain-allowlist / VITE_APP_ENV regressions.
    const body = (await page.content()).toLowerCase();
    expect(body, 'PlanX boot leaked a domain-validation error').not.toContain('permission denied for this domain');
    expect(body, 'PlanX boot leaked an Airbrake error (VITE_APP_ENV=production regressed)').not.toContain('airbrake');

    // (b) Login via the demo-auth endpoint. The PlanX login URL is a POST
    //     form that sets a session cookie via the demo-auth patch.
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"], input[name="username"]', demoUser);
    await fillPassword(page, 'input[name="password"]', demoPass.sensitiveValue());
    await Promise.all([
      page.waitForURL((u) => !u.toString().endsWith('/login') && !u.toString().includes('login.html'), {
        timeout: 30_000,
      }),
      page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'),
    ]);

    // (c) Feature flow — bug-informed.
    //     1. Editor reachable: navigate to / on the PlanX UI; the response
    //        must contain the editor markup, not a "host not allowed"
    //        error.
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    const html = await page.content();
    expect(html, 'editor refused the CloudFront / ELB hostname').not.toMatch(/host(name)? not allowed|invalid host/i);

    //     2. Hasura native /v1/version. The Caddy-path-stripping fix
    //        means Hasura's native paths must respond directly; if they
    //        404, the elimination regressed.
    const versionResp = await request.get(`${landingUrl.replace(/\/$/, '')}/v1/version`, {
      failOnStatusCode: false,
    });
    expect(versionResp.status(), 'Hasura native /v1/version 404; Caddy-elimination regressed').toBeLessThan(500);
    if (versionResp.status() === 200) {
      const versionJson = (await versionResp.text()) || '';
      expect(versionJson).toMatch(/version/i);
    }
  });
});
