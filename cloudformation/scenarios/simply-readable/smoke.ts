import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

const here = dirname(fileURLToPath(import.meta.url));

// Verifies SPA loads, redirects to Cognito hosted UI, credentials present
// and properly redacted, Lambda asset wiring works (no 5xx on reload),
// admin can sign in via the Cognito hosted UI, and a translation job can
// be created end-to-end (file upload + target-language selection + submit).
// The translation itself can take minutes (or longer for large jobs via
// the Amazon Translate batch path) — we only assert the job is accepted
// and shows up in History.
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

    // Cognito hosted UI duplicates the sign-in form in the DOM (one hidden,
    // one rendered post-bootstrap). The default helpers fill `.first()` and
    // pick the hidden one, so we drive the visible copy explicitly via
    // `:visible` filtering.
    const usernameInput = page.locator('#signInFormUsername').filter({ visible: true });
    const passwordInput = page.locator('#signInFormPassword').filter({ visible: true });
    await expect(usernameInput, 'no visible Cognito username input — hosted UI regression').toBeVisible();
    await expect(passwordInput, 'no visible Cognito password input').toBeVisible();
    await usernameInput.fill(adminUser);
    await passwordInput.fill(adminPass.sensitiveValue());
    // Clicking the Cognito hosted-UI "Sign in" button can no-op intermittently
    // (no observed network call), even though the visible button is the one
    // the user clicks manually. Submitting the visible form directly is
    // equivalent and reliable; the form already carries the hosted-UI CSRF
    // token in its hidden inputs.
    await Promise.all([
      page.waitForURL((u) => !/amazoncognito\.com/.test(u.toString()), { timeout: 30_000 }),
      passwordInput.evaluate((el) => (el as HTMLInputElement).form?.submit()),
    ]);

    // After Cognito returns the auth code the SPA exchanges it and lands
    // on /. A failed handshake leaves the URL at the appUrl origin with
    // ?code= in the query but no rendered app — assert the signed-in nav
    // chrome (admin button + Translation sub-nav) is rendered.
    await expect(page.getByRole('button', { name: 'admin' }), 'admin nav button did not render after login — token exchange regression').toBeVisible({ timeout: 30_000 });

    // Drive a translation submit end-to-end. The accept attribute on the
    // file input covers docx, so a python-docx generated fixture is fine.
    await page.goto(new URL('/translation/new', appUrl).toString(), { waitUntil: 'domcontentloaded' });

    // Inject a unique filename per run so the History assertion below can
    // distinguish this run's job from older ones (the admin user persists
    // job history across smoke runs against the same lease).
    const uniqueName = `smoke-${Date.now()}.docx`;
    const fixturePath = resolve(here, '../../../tests/smoke/fixtures/translate-test.docx');
    await page.locator('input[type=file]').setInputFiles({
      name: uniqueName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: readFileSync(fixturePath),
    });

    // Tick a single target language. Welsh sits in the visible portion of
    // the Cloudscape list without scrolling and is a natural fit for the
    // scenario's UK public-sector audience.
    await page.getByRole('checkbox', { name: 'Welsh (cy)' }).check();

    const submit = page.locator('button[data-testid="translation-new-submit"]');
    await expect(submit, 'Submit button stayed disabled — file or target-language wiring regression').toBeEnabled({ timeout: 10_000 });
    await submit.click();

    // The SPA either shows a "Fast Translation" in-page progress overlay
    // (for small text-only payloads, finished within seconds) or routes
    // to /translation/history and queues an Amazon Translate batch job
    // (which can take 30+ minutes per AWS's own example workflows). We
    // only assert that the submit was accepted and a History entry
    // exists, regardless of which path the SPA picked.
    await page.goto(new URL('/translation/history', appUrl).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator(`text=${uniqueName}`), 'translation job did not appear in History after submit').toBeVisible({ timeout: 30_000 });

    expect(failedResponses, `5xx during authenticated flow: ${failedResponses.join(', ')}`).toEqual([]);
  },
});
