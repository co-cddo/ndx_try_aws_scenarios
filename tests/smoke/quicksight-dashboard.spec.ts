/**
 * QuickSight Dashboard smoke spec.
 *
 * Auth mode: sso-skip — QuickSight Enterprise login is SSO-driven; the
 * smoke pack does not drive the IdP. Per the spec's auth-mode
 * categorisation, this scenario gets (a) landing-URL responds and (d)
 * Outputs are present and shaped correctly. (b) login and (c) feature
 * flow are explicitly skipped.
 *
 * NB: this scenario depends on a QuickSight Enterprise subscription on
 * the smoke account. Tracked separately under NAP-551. If the
 * subscription isn't provisioned, the spec is expected to be flipped to
 * quarantined.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'quicksight-dashboard';

test.describe(SCENARIO, () => {
  test('dashboard URL redirects to QuickSight SSO + DataBucket present (sso-skip)', async ({ request }) => {
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

    const dashboardUrl = requireSafe(outputs, 'QuicksightDashboardUrl');
    const dataBucket = requireSafe(outputs, 'QuicksightDataBucket');

    // (a) Landing. Don't follow redirects; the URL should redirect to
    //     the QuickSight sign-in / SSO host without a 5xx.
    const resp = await request.get(dashboardUrl, { failOnStatusCode: false, maxRedirects: 0 });
    expect(resp.status(), 'QuickSight dashboard URL 5xx').toBeLessThan(500);

    // (d) Outputs present.
    expect(dashboardUrl, 'dashboard URL empty').toMatch(/^https?:\/\//);
    expect(dataBucket, 'DataBucket empty').toMatch(/^.+$/);

    // (b) and (c) deliberately skipped per spec's auth-mode categorisation
    //     for SSO/external scenarios.
  });
});
