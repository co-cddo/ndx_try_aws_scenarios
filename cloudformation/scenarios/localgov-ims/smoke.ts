import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';
import { adminLogin } from '../../../tests/smoke/helpers';

runSmoke({
  scenario: 'localgov-ims',
  outputs: [
    'LocalgovImsAdminPortalUrl',
    'LocalgovImsPaymentPortalUrl',
    'LocalgovImsAdminUsername',
    'LocalgovImsAdminPassword',
  ],
  test: async ({ page, get, getSecret }) => {
    const adminUrl = get('LocalgovImsAdminPortalUrl');
    const paymentUrl = get('LocalgovImsPaymentPortalUrl');

    await page.goto(adminUrl, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(new URL(adminUrl).hostname);

    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(new URL(paymentUrl).hostname);

    const adminUser = get('LocalgovImsAdminUsername');
    const adminPass = getSecret('LocalgovImsAdminPassword');
    // Lambda-custom-resource regressed once and returned the literal {{resolve:...}} token.
    expect(adminPass.sensitiveValue()).not.toMatch(/\{\{resolve:/);
    expect(adminUser).not.toMatch(/\{\{resolve:/);

    await adminLogin(page, {
      url: adminUrl,
      username: adminUser,
      password: adminPass,
      usernameSelector: 'input[name="Email"], input[name="Username"], input#Email',
      passwordSelector: 'input[name="Password"], input#Password',
    });

    expect(await page.content()).not.toMatch(/access denied|forbidden|unauthorized/i);
  },
});
