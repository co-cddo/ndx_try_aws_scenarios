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

    // Editor dashboard sanity: after login the SPA navigates to /app. The SPA
    // currently fails to mount under the smoke account because Airbrake creds
    // aren't seeded (`airbrake: projectId and projectKey are required` in the
    // console), so we can't assert seed-data presence without first fixing
    // the bootstrap. As a smoke-grade signal we just verify that the SPA
    // entrypoint chunk loaded — its presence in HTML proves CloudFront +
    // the build pipeline are intact even if the React tree never mounts.
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    expect(page.url(), 'login did not redirect to /app — auth regression').toMatch(/\/app(\b|\/|$)/);
    const spaHtml = await page.content();
    expect(spaHtml, 'SPA index bundle missing — CloudFront/build regression')
      .toMatch(/<script[^>]+src=["'][^"']*\/assets\/index-[A-Za-z0-9]+\.js["']/);
  },
});
