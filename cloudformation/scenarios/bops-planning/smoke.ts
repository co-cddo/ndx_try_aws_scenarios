import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'bops-planning',
  outputs: ['BopsPlanningUrl', 'BopsPlanningLoginUrl', 'BopsPlanningUsername', 'BopsPlanningPassword'],
  test: async ({ page, get, getSecret }) => {
    await page.goto(get('BopsPlanningUrl'), { waitUntil: 'domcontentloaded' });
    const body = (await page.content()).toLowerCase();
    expect(body).not.toContain('we&#39;re sorry, but something went wrong');
    // base64-encoded routing.rb single-tenant override must reach the container; fall-through goes to Applicants.
    expect(body).not.toMatch(/applicants? portal/);

    await adminLogin(page, {
      url: getSecret('BopsPlanningLoginUrl').sensitiveValue(),
      username: get('BopsPlanningUsername'),
      password: getSecret('BopsPlanningPassword'),
      usernameSelector: 'input[name="user[email]"], input#user_email',
      passwordSelector: 'input[name="user[password]"], input#user_password',
      submitSelector: 'input[name="commit"], button[type="submit"]',
      awayFrom: 'sign_in',
    });

    // Applicants port :8080 in post-login URL = routing override regressed.
    expect(page.url()).not.toContain(':8080');

    // After successful login the assessor lands on /planning_applications/mine
    // — the case-officer dashboard. Seeded data includes at least one prior
    // approval and the standard 5-tab nav. Missing tabs = template regression;
    // empty dashboard = seed missing.
    await expect(page.locator('body')).toContainText(/Planning Applications/i);
    const tabs = await page.locator('.govuk-tabs__tab, [role="tab"]').count();
    expect(tabs, 'BOPS dashboard tabs missing — Rails template regression').toBeGreaterThanOrEqual(3);

    // Cases-assigned + unassigned + all-cases queues should resolve. Drill into
    // "All cases" — it lists every seeded application across all statuses.
    const baseUrl = get('BopsPlanningUrl').replace(/\/$/, '');
    await page.goto(`${baseUrl}/planning_applications/all`, { waitUntil: 'domcontentloaded' });
    const appRows = await page.locator('a[href*="/planning_applications/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? '')
        // Filter to ID-suffixed application detail links: /planning_applications/<numeric-id>
        .filter((h) => /\/planning_applications\/\d+($|\?)/.test(h)),
    );
    expect(appRows.length, '/planning_applications/all shows no seeded applications — seed_sample_data.rb regression').toBeGreaterThan(0);
  },
});
