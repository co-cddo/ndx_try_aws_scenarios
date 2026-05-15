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
    await Promise.all([
      page.waitForURL((u) => !u.toString().toLowerCase().includes('auth'), { timeout: 30_000 }),
      page.locator('button[type="submit"], input[type="submit"]').first().click(),
    ]);

    // /reports requires bin/update-all-reports to have produced data/all-reports.json.
    await page.goto(`${root}/reports`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error/i);
    await expect(page).toHaveTitle(/Reports|FixMyStreet/i);

    // STAGING_FLAGS skip_must_have_2fa must hold; otherwise /admin redirects to 2FA setup.
    await page.goto(`${root}/admin`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toMatch(/two_factor|2fa|two-factor/);
    await expect(page.locator('body')).toContainText(/(Reports|Bodies|Users|Categories)/i);
  },
});
