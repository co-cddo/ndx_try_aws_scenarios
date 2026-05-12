/**
 * Minute AI smoke spec.
 *
 * Auth mode: admin-login (HTTP basic auth from CFN outputs). Priority #3 per
 * the tech-spec because of 12 historical issues (see minute-scenario-lessons
 * memory).
 *
 * Bug-informed feature flow: after basic auth, verify the SPA can fetch()
 * from itself (catches the CloudFront-embedded-basic-auth regression where
 * fetch() refuses embedded credentials in modern browsers) AND the frontend
 * middleware proxies /api/proxy/* to the backend without an ALB rule
 * intercepting (catches the ALB /api/* rule regression).
 *
 * Phase 4 / per tech-spec assertion-bar table row.
 */

import { test, expect } from '@playwright/test';

import {
  fetchStackOutputs,
  requireSafe,
  requireSensitive,
} from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'minute';

test.describe(SCENARIO, () => {
  test('landing + basic-auth + fetch() works post-auth + /api/proxy passthrough (bug-informed)', async ({
    browser,
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

    const landingUrl = requireSafe(outputs, 'MinuteUrl');
    const baUser = requireSafe(outputs, 'MinuteBasicAuthUsername');
    const baPass = requireSensitive(outputs, 'MinuteBasicAuthPassword');

    // We use a fresh context with httpCredentials so the basic-auth is
    // attached to every request (NOT embedded in the URL, which the spec
    // memory specifically calls out as breaking fetch() in modern browsers).
    const context = await browser.newContext({
      httpCredentials: { username: baUser, password: baPass.sensitiveValue() },
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    try {
      // (a) Landing assertion. Page must load past basic auth and serve the
      //     SPA shell.
      const resp = await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), 'Minute landing returned non-success').toBeLessThan(400);
      // Body contains the Minute application shell (look for the title or a
      // known landmark; "Minute" appears in title and copy).
      await expect(page).toHaveTitle(/Minute/i);

      // (c) Bug-informed feature flow.
      //     1. fetch() from inside the page must succeed. If CloudFront
      //        Function basic auth is regressed (i.e. credentials are
      //        embedded in the URL), modern browsers reject fetch() with a
      //        SecurityError. We perform the fetch via page.evaluate to
      //        catch that case.
      const selfFetchStatus = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/health', {
            credentials: 'same-origin',
          });
          return r.status;
        } catch (e) {
          return -1;
        }
      });
      expect(
        selfFetchStatus,
        'fetch() from the SPA failed — CloudFront-embedded basic auth regressed (modern browsers reject fetch() with embedded credentials)',
      ).not.toBe(-1);

      //     2. /api/proxy passthrough must work via the frontend middleware,
      //        NOT via an ALB API rule. Hit a known backend endpoint via the
      //        proxy.
      const apiResp = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/api/proxy/healthcheck', {
            credentials: 'same-origin',
          });
          return { status: r.status, ok: r.ok };
        } catch (e) {
          return { status: -1, ok: false };
        }
      });
      expect(
        apiResp.status,
        '/api/proxy/healthcheck failed — frontend middleware proxy regressed (ALB rule intercepting?)',
      ).toBeGreaterThan(0);
      expect(apiResp.status, '/api/proxy/healthcheck non-success').toBeLessThan(500);
    } finally {
      await context.close();
    }
  });
});
