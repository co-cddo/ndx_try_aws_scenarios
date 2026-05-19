import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

// Smoke does NOT drive the Cognito Hosted UI sign-in (first-time password
// reset is too brittle). Verifies SPA loads, redirects to Cognito hosted UI,
// credentials present + properly redacted, and Lambda asset wiring works
// (no 5xx on reload).
runSmoke({
  scenario: 'simply-readable',
  outputs: ['SimplyReadableAppUrl', 'SimplyReadableAdminUsername', 'SimplyReadableAdminPassword'],
  outputAliases: {
    SimplyReadableAppUrl: 'AppUrl',
    SimplyReadableAdminUsername: 'AdminUsername',
    SimplyReadableAdminPassword: 'AdminPassword',
  },
  test: async ({ page, get, getSecret }) => {
    const appUrl = get('SimplyReadableAppUrl');
    const adminUser = get('SimplyReadableAdminUsername');
    const adminPass = getSecret('SimplyReadableAdminPassword');

    // Track 5xx responses across all subsequent navigations. The
    // BlueprintsBucketName parameter wiring used to surface as a 5xx on
    // asset fetch that looked like SPA-success on first paint.
    const failedResponses: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500) {
        failedResponses.push(`${resp.status()} ${resp.url()}`);
      }
    });

    // App URL redirects to the Cognito hosted UI. A healthy app reaches the
    // Cognito subdomain and renders the sign-in form. Failure modes here:
    // - Stuck on appUrl with a JS error  → SPA crash before Auth bootstrap
    // - 5xx anywhere                     → CloudFront/origin regression
    // - Wrong Cognito user-pool domain   → identity-pool wiring regression
    const resp = await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    expect(page.url(), 'app did not redirect to Cognito hosted UI — Auth bootstrap regression')
      .toMatch(/amazoncognito\.com\/login\?/);
    await expect(page).toHaveTitle(/Sign\s?[Ii]n/);

    const html = (await page.content()).toLowerCase();
    expect(html).not.toMatch(/error.*chunkloaderror|failed to fetch dynamically imported/);
    expect(html).not.toContain('your-graphql-endpoint');

    expect(adminUser).not.toMatch(/^\{|placeholder|TODO|UNSET/i);
    expect(adminPass.length).toBeGreaterThan(8);
    expect(adminPass.sensitiveValue()).not.toMatch(/\{\{resolve:/);

    // Reload the app entry to confirm CloudFront serves SPA assets without
    // 5xx. The page handler above appends any 5xx to failedResponses.
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    expect(failedResponses, `5xx on SPA asset fetch: ${failedResponses.join(', ')}`).toEqual([]);

    // Cognito hosted UI must render the username + password inputs for the
    // operator (or, post-merge, a smoke-managed user) to sign in. A blank
    // hosted-UI page = Cognito user-pool deletion regression. The default
    // hosted UI renders username with display:none until the OAuth flow
    // progresses, so check presence in DOM rather than visibility.
    expect(await page.locator('input[name="username"], input#signInFormUsername').count(),
      'Cognito hosted UI missing username input — user-pool deletion regression').toBeGreaterThan(0);
    expect(await page.locator('input[type="password"], input#signInFormPassword').count(),
      'Cognito hosted UI missing password input').toBeGreaterThan(0);
  },
});
