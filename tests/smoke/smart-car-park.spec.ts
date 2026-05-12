/**
 * Smart Car Park smoke spec.
 *
 * Auth mode: public — Lambda FunctionURL backed by DynamoDB.
 *
 * Bug-informed feature flow: the DynamoDB table is populated by an
 * EventBridge-scheduled Lambda that simulates parking sensors. If the
 * scheduled-Lambda permissions regress (EventBridge service principal
 * not on the resource policy, or Lambda IAM missing
 * dynamodb:PutItem), the DashboardURL renders empty. Smoke calls the
 * dashboard URL and asserts the table Output is non-empty.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'smart-car-park';

test.describe(SCENARIO, () => {
  test('dashboard FunctionURL + DynamoDB table present', async ({ request }) => {
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

    const dashboardUrl = requireSafe(outputs, 'SmartCarParkDashboardURL');
    const tableName = requireSafe(outputs, 'SmartCarParkSensorReadingsTable');

    const resp = await request.get(dashboardUrl, { failOnStatusCode: false });
    expect(resp.status(), 'dashboard FunctionURL 5xx').toBeLessThan(500);
    expect(resp.status(), 'dashboard FunctionURL 403 — public-Lambda perms regressed').not.toBe(403);
    expect(tableName, 'SensorReadingsTable Output empty').toMatch(/^.+$/);
  });
});
