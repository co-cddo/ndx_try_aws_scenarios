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
  },
});
