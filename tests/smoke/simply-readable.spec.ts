/**
 * Simply Readable smoke spec.
 *
 * Auth mode: admin-login (Cognito user pool). The smoke pack does NOT
 * drive the Cognito Hosted UI sign-in flow — that requires manual
 * password-reset on first login and would be brittle. Smoke verifies
 * (a) the SPA loads, (b) the admin-credentials Outputs are non-empty
 * and properly redacted (per the simply-readable-lessons memory the
 * template.yaml/dist sync was a recurring regression that left
 * placeholder values in Outputs), and (c) the BlueprintsBucketName
 * parameter is wired correctly by the umbrella all-demo template (no
 * Lambda asset-not-found errors in the deployed Lambdas).
 *
 * Historical regressions cited: template.yaml vs dist drift; missing
 * ISB-BedrockAccess inline policies on Lambda roles; cross-region
 * inference profile leaks; nested model-table format (text.M / image.M
 * sub-objects).
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe, requireSensitive } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'simply-readable';

test.describe(SCENARIO, () => {
  test('SPA loads + credentials present + Lambda assets resolved', async ({ page }) => {
    const row = requireAssertionBar(SCENARIO);
    if (row.quarantine.state === 'quarantined') {
      test.skip(true, `Quarantined until ${row.quarantine.until}: ${row.quarantine.reason}`);
    }

    const outputs = await fetchStackOutputs({
      stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
      region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
    });

    for (const key of row.outputsToCheck) {
      expect(outputs[key], `CFN output ${key} missing`).toBeDefined();
    }

    const appUrl = requireSafe(outputs, 'SimplyReadableAppUrl');
    const adminUsername = requireSafe(outputs, 'SimplyReadableAdminUsername');
    const adminPassword = requireSensitive(outputs, 'SimplyReadableAdminPassword');

    // (a) SPA loads.
    await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    const html = (await page.content()).toLowerCase();
    expect(html, 'React build error visible').not.toMatch(/error.*chunkloaderror|failed to fetch dynamically imported/);
    expect(html, 'API URL missing — appsync misconfig').not.toContain('your-graphql-endpoint');

    // (b) Credentials present and not placeholder strings.
    expect(adminUsername, 'admin username placeholder').not.toMatch(/^\{|placeholder|TODO|UNSET/i);
    expect(adminPassword.length, 'admin password too short').toBeGreaterThan(8);
    expect(adminPassword.sensitiveValue(), 'admin password is the resolve token literal').not.toMatch(/\{\{resolve:/);

    // (c) Static-asset/Lambda integrity proxy: the React build references
    //     auth.json or runtime config from CloudFront. If the BlueprintsBucketName
    //     parameter wasn't wired, the SPA loads but config endpoints 404.
    //     Smoke this lightly by looking at the network requests for any 5xx
    //     during initial page load.
    const failedResponses: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500) {
        failedResponses.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.reload({ waitUntil: 'networkidle' });
    expect(failedResponses, 'SPA reload produced 5xx responses').toEqual([]);
  });
});
