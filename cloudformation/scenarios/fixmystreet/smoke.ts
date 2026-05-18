import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { fillPassword } from '../../../tests/smoke/fixtures/secure-form';

runSmoke({
  scenario: 'fixmystreet',
  outputs: ['FixMyStreetUrl', 'FixMyStreetAdminUsername', 'FixMyStreetAdminPassword'],
  test: async ({ page, get, getSecret }) => {
    const landing = get('FixMyStreetUrl');
    const root = landing.replace(/\/$/, '');

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/FixMyStreet/i);
    // ALB sidecar mis-routing regression leaks absolute :9000 URLs into the page.
    expect(await page.content()).not.toMatch(/https?:\/\/[^"'\s]*:9000/);

    // FMS uses a two-stage form: fill email → click "Sign in with a password"
    // → password field appears. Inline here because adminLogin assumes single-stage.
    await page.goto(`${root}/auth`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"], input[name="email"], input#email')
      .first()
      .fill(get('FixMyStreetAdminUsername'));
    await page.getByRole('button', { name: /Sign in with a password/i }).click();
    await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 15_000 });
    await fillPassword(
      page,
      'input[name="password"], input[type="password"]',
      getSecret('FixMyStreetAdminPassword').sensitiveValue(),
      { fieldNames: ['password'] },
    );
    // Two buttons named "Sign in" exist (Header link + form submit); scope to the
    // form to pick the submit button. Also press Enter on the password field as a
    // fallback in case the button click is racy.
    await Promise.all([
      page.waitForURL((u) => !u.toString().toLowerCase().includes('auth'), { timeout: 45_000 }),
      page.locator('form').filter({ has: page.locator('input[type="password"]') })
        .getByRole('button', { name: /^Sign in$/i })
        .first()
        .click(),
    ]);

    // /reports requires bin/update-all-reports to have produced data/all-reports.json.
    // The page renders aggregate "N reports" counts per category. Verifying that
    // at least one category has > 0 reports proves: bin/update-all-reports ran,
    // Aurora is populated with seeded data, and the dashboard template can read
    // it. A failure here points squarely at seed/DB/cron health.
    await page.goto(`${root}/reports`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error/i);
    await expect(page).toHaveTitle(/Reports|FixMyStreet/i);
    const reportCounts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('td, .summary-count, .dashboard__cell'))
        .map((e) => e.textContent?.match(/^\s*(\d+)\s*reports?\b/i)?.[1])
        .filter((n): n is string => !!n)
        .map((n) => parseInt(n, 10)),
    );
    expect(reportCounts.length, '/reports dashboard rendered no "N reports" cells').toBeGreaterThan(0);
    expect(Math.max(...reportCounts, 0), '/reports dashboard shows zero reports across all categories — seed/DB/cron regression').toBeGreaterThan(0);

    // STAGING_FLAGS skip_must_have_2fa must hold; otherwise /admin redirects to 2FA setup.
    await page.goto(`${root}/admin`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toMatch(/two_factor|2fa|two-factor/);
    await expect(page.locator('body')).toContainText(/(Reports|Bodies|Users|Categories)/i);

    // Admin reports moderation queue: real seeded data should produce links to
    // individual reports. Empty queue = seed regression OR an auth/permission
    // regression silently downgraded the admin role.
    await page.goto(`${root}/admin/reports`, { waitUntil: 'domcontentloaded' });
    const adminReportLinks = await page.locator('a[href*="/report/"]').count();
    expect(adminReportLinks, '/admin/reports has no report links — seed missing OR admin role downgraded').toBeGreaterThan(0);
  },
});
