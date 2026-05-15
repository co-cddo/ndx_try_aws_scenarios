import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'paperless-ngx',
  outputs: ['PaperlessNgxUrl', 'PaperlessNgxAdminUsername', 'PaperlessNgxAdminPassword'],
  test: async ({ page, get, getSecret }) => {
    const landing = get('PaperlessNgxUrl');
    const root = landing.replace(/\/$/, '');

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    // Paperless-NGX (Angular) form labels inputs by placeholder; name= may not be set.
    await page.waitForSelector('input[type="text"], input[name="username"], input#username', { timeout: 30_000 });

    await adminLogin(page, {
      url: page.url(),
      username: get('PaperlessNgxAdminUsername'),
      password: getSecret('PaperlessNgxAdminPassword'),
      usernameSelector: 'input[type="text"], input[name="username"], input#username',
      passwordSelector: 'input[type="password"], input[name="password"], input#password',
    });

    // /api/documents/ 500 = S3 Files mount or Postgres regressed.
    await page.goto(`${root}/documents`, { waitUntil: 'domcontentloaded' });
    const apiStatus = await page.evaluate(async () => {
      try {
        const r = await fetch(window.location.origin + '/api/documents/?page=1', {
          credentials: 'same-origin',
        });
        return r.status;
      } catch {
        return -1;
      }
    });
    expect(apiStatus).toBeGreaterThan(0);
    expect(apiStatus).toBeLessThan(500);
  },
});
