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
  outputAliases: {
    LocalgovImsAdminPortalUrl: 'AdminPortalUrl',
    LocalgovImsPaymentPortalUrl: 'PaymentPortalUrl',
    LocalgovImsAdminUsername: 'AdminUsername',
    LocalgovImsAdminPassword: 'AdminPassword',
  },
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

    // Post-login the admin lands on the dashboard. Verify the IIS-served IMS
    // nav is intact (Dashboard / Transactions / Payment / Users / etc.) — a
    // missing nav points at .NET app pool failure that still serves a 200.
    await expect(page.locator('a:has-text("Dashboard")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Transactions")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Payment")').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/System overview|Dashboard/i);

    // GOV.UK Pay integration: navigate to the Payment / Create page. The form
    // renders the GOV.UK Pay-backed payment basket. A 5xx here would mean
    // the SQL Server connection or the integration secret is broken.
    const baseAdmin = adminUrl.replace(/\/Account\/Login.*$/, '');
    await page.goto(`${baseAdmin}/Payment`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2', { hasText: /Create a payment/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Basket/i);
  },
});
