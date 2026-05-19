import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'planx',
  outputs: ['PlanXUrl', 'PlanXLoginUrl', 'PlanXDemoUsername', 'PlanXDemoPassword'],
  outputAliases: {
    PlanXDemoUsername: 'DemoUsername',
    PlanXDemoPassword: 'DemoPassword',
  },
  test: async ({ page, request, get, getSecret }) => {
    const landing = get('PlanXUrl');
    const root = landing.replace(/\/$/, '');

    // Capture console errors across the whole test so we can fail on the
    // Airbrake bootstrap crash (`projectId and projectKey are required`).
    // The crash is thrown synchronously during module init and blanks the
    // SPA. The CI Dockerfile + airbrake.ts overlay must keep this clean.
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    const body = (await page.content()).toLowerCase();
    expect(body).not.toContain('permission denied for this domain');

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

    // Editor dashboard must render. Upstream renders the team-selector page
    // (`<h1>Select a team</h1>` + `<h2>My teams</h2>` + at least one team
    // card link) for an authenticated user with no active team in path.
    // A blanked SPA (the old Airbrake bootstrap crash) trips here.
    await expect(page.locator('h1', { hasText: /Select a team/i }),
      'editor dashboard "Select a team" heading missing — SPA failed to mount').toBeVisible({ timeout: 30_000 });
    await expect(page.locator('h2', { hasText: /My teams/i }),
      '"My teams" section missing — auth bootstrap or store regression').toBeVisible();
    const teamLinks = await page.locator('a[href^="/"]:not([href="/"]):not([href*="logout"]):not([href*="login"])').count();
    expect(teamLinks, 'no team links on dashboard — Hasura seed or auth-store regression').toBeGreaterThan(0);

    // The Airbrake bootstrap crash leaves a console error matching this
    // pattern; if it's back, the CI overlay (drop VITE_APP_AIRBRAKE_* +
    // stub airbrake.ts) has regressed.
    const airbrakeBoot = consoleErrors.find((m) => /airbrake.*projectId.*projectKey.*required/i.test(m));
    expect(airbrakeBoot,
      `Airbrake bootstrap crash returned: ${airbrakeBoot}`).toBeUndefined();
  },
});
