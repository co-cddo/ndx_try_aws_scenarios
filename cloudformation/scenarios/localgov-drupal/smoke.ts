import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'localgov-drupal',
  outputs: ['DrupalUrl', 'DrupalAdminUsername', 'DrupalAdminPassword'],
  test: async ({ page, get, getSecret }) => {
    const landing = get('DrupalUrl');
    const root = landing.replace(/\/$/, '');

    await page.goto(landing, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/.+/);
    const html = (await page.content()).toLowerCase();
    expect(html).not.toContain('fatal error');
    // ndx_aws_ai bootstraps Bedrock at cache:bin construction; AccessDenied here = regressed model access.
    expect(html).not.toContain('accessdeniedexception');

    await adminLogin(page, {
      url: `${root}/user/login`,
      username: get('DrupalAdminUsername'),
      password: getSecret('DrupalAdminPassword'),
      usernameSelector: 'input[name="name"]',
      passwordSelector: 'input[name="pass"]',
      passwordFieldNames: ['pass', 'password'],
    });

    await page.goto(`${root}/admin`, { waitUntil: 'domcontentloaded' });
    const adminBody = (await page.content()).toLowerCase();
    expect(adminBody).not.toContain('accessdeniedexception');
    expect(adminBody).not.toMatch(/module .* could not be enabled/);
  },
});
