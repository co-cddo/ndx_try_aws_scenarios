/**
 * Minute AI smoke spec.
 *
 * Auth mode: admin-login via the MinuteLoginUrl (`?key=<token>`) magic-link
 * that the CloudFront Function consumes once and sets a 7-day HttpOnly
 * cookie. Replaces the previous CloudFront basic-auth flow, which got
 * suppressed by corporate-managed Chromium and stripped from URLs by
 * modern browsers (per commit 6387441 on main, "minute: replace basic
 * auth with magic-link + cookie").
 *
 * Bug-informed feature flow: visit MinuteLoginUrl, confirm the redirect
 * lands on the clean URL (proves the CF Function set the cookie), then
 * inside the SPA verify fetch() against the same origin succeeds AND
 * /api/proxy/healthcheck reaches the backend via the frontend middleware
 * (catches the ALB /api/* interception regression).
 *
 * Phase 4 / per tech-spec assertion-bar table row.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe, requireSensitive } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'minute';

test.describe(SCENARIO, () => {
  test('magic-link sets cookie + fetch() works post-auth + /api/proxy passthrough', async ({ browser }) => {
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

    const minuteUrl = requireSafe(outputs, 'MinuteUrl');
    // MinuteLoginUrl contains the auth token in its query string; treat as
    // sensitive so the value doesn't show up in logs / Playwright traces.
    const loginUrl = requireSensitive(outputs, 'MinuteLoginUrl');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    try {
      // (a)+(b) Visit MinuteLoginUrl. The CloudFront Function consumes
      //         ?key=<token>, sets a 7-day session cookie, and 302s to
      //         the clean URL. Loading that URL post-redirect proves the
      //         cookie path works.
      const resp = await page.goto(loginUrl.sensitiveValue(), { waitUntil: 'domcontentloaded' });
      expect(resp?.status() ?? 0, 'MinuteLoginUrl returned non-success after redirect').toBeLessThan(400);
      // After the cookie is set, the resulting URL should not contain `key=`.
      expect(page.url(), 'no redirect away from /?key=; CF Function did not consume the token').not.toContain('key=');
      await expect(page).toHaveTitle(/Minute/i);

      // (c) Bug-informed feature flow.
      //     1. fetch() from inside the page must succeed. With the cookie set,
      //        same-origin fetch should send the cookie and resolve.
      const selfFetchStatus = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/health', { credentials: 'same-origin' });
          return r.status;
        } catch {
          return -1;
        }
      });
      expect(selfFetchStatus, 'fetch() from the SPA failed (session-cookie path broken?)').not.toBe(-1);

      //     2. /api/proxy passthrough must work via the frontend middleware.
      //        Catches the ALB /api/* rule interception regression.
      const apiResp = await page.evaluate(async () => {
        try {
          const r = await fetch(window.location.origin + '/api/proxy/healthcheck', { credentials: 'same-origin' });
          return { status: r.status };
        } catch {
          return { status: -1 };
        }
      });
      expect(apiResp.status, '/api/proxy/healthcheck failed').toBeGreaterThan(0);
      expect(apiResp.status, '/api/proxy/healthcheck 5xx').toBeLessThan(500);
    } finally {
      await context.close();
    }

    // The clean MinuteUrl is the origin that same-origin fetch above relies on.
    expect(minuteUrl).toMatch(/^https:\/\//);
  });
});
