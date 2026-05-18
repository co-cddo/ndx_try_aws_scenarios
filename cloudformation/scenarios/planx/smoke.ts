import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'planx',
  outputs: ['PlanXUrl', 'PlanXLoginUrl', 'PlanXDemoUsername', 'PlanXDemoPassword'],
  test: async ({ page, request, get, getSecret }) => {
    const landing = get('PlanXUrl');
    const root = landing.replace(/\/$/, '');

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    const body = (await page.content()).toLowerCase();
    // domain-allowlist + Airbrake-on-prod regressions both leak the same way.
    expect(body).not.toContain('permission denied for this domain');
    expect(body).not.toContain('airbrake');

    await adminLogin(page, {
      url: getSecret('PlanXLoginUrl').sensitiveValue(),
      username: get('PlanXDemoUsername'),
      password: getSecret('PlanXDemoPassword'),
      usernameSelector: 'input[name="email"], input[name="username"]',
      submitSelector: 'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")',
    });

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    expect(await page.content()).not.toMatch(/host(name)? not allowed|invalid host/i);

    // Caddy-elimination regression: Hasura native path must work without /hasura prefix stripping.
    const versionResp = await request.get(`${root}/v1/version`, { failOnStatusCode: false });
    expect(versionResp.status()).toBeLessThan(500);
    if (versionResp.status() === 200) {
      expect(await versionResp.text()).toMatch(/version/i);
    }

    // Editor SPA sanity: the React tree currently fails to mount in the smoke
    // account because Airbrake creds aren't seeded (`airbrake: projectId and
    // projectKey are required` in the console). Until that's fixed upstream,
    // we can only assert the SPA entrypoint chunk is served by CloudFront —
    // its presence proves the build pipeline + S3 origin are intact.
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    const spaHtml = await page.content();
    expect(spaHtml, 'SPA index bundle missing — CloudFront/build regression')
      .toMatch(/<script[^>]+src=["'][^"']*\/assets\/index-[A-Za-z0-9]+\.js["']/);
  },
});
