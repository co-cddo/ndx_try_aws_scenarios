import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'planx',
  outputs: ['PlanXUrl', 'PlanXLoginUrl', 'PlanXDemoUsername', 'PlanXDemoPassword'],
  test: async ({ page, request, get, getSecret }) => {
    const landing = get('PlanXUrl');

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
    const versionResp = await request.get(`${landing.replace(/\/$/, '')}/v1/version`, {
      failOnStatusCode: false,
    });
    expect(versionResp.status()).toBeLessThan(500);
    if (versionResp.status() === 200) {
      expect(await versionResp.text()).toMatch(/version/i);
    }
  },
});
