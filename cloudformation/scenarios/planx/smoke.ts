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

    // Editor dashboard: after login the SPA lists teams + flows. Seeded data
    // includes at least one team and one published flow. An empty editor =
    // the seed migrations didn't run OR the API server can't reach Postgres.
    // Wait for the team links to render (SPA loads asynchronously after auth
    // cookie is set on previous navigation).
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    const teamLinks = await page.locator('a[href^="/"][href*="-team"], main a:has-text("Council"), a[href*="/services"]').count();
    // Fallback assertion: the editor renders SOME navigable card/link after login.
    const interactiveCount = await page.locator('main a, main button').count();
    expect(
      teamLinks > 0 || interactiveCount > 5,
      `editor dashboard rendered no team/flow links (teamLinks=${teamLinks}, interactiveCount=${interactiveCount}) — seed data missing or API unreachable`,
    ).toBe(true);
  },
});
