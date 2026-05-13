import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

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

    await adminLogin(page, {
      url: `${root}/auth`,
      username: get('FixMyStreetAdminUsername'),
      password: getSecret('FixMyStreetAdminPassword'),
      awayFrom: 'auth',
      passwordFieldNames: ['password'],
    });

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
