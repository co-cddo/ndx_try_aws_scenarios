/**
 * FOI Redaction smoke spec.
 *
 * Auth mode: public — Lambda FunctionURL. No login flow.
 *
 * Bug-informed feature flow: per the feedback_isb_blocks_public_lambda_urls
 * memory, ISB pool accounts need BOTH `InvokeFunctionUrl` AND
 * `InvokeFunction` (with `InvokedViaFunctionUrl=true`) for the function
 * URL to be publicly callable. Smoke proves the URL returns < 5xx for a
 * GET against it; a 403 would indicate the dual-permission setup
 * regressed. The Documents bucket Output is also asserted as a deploy-
 * completeness check.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'foi-redaction';

test.describe(SCENARIO, () => {
  test('public FunctionURL reachable (both InvokeFunctionUrl + InvokeFunction perms)', async ({ request }) => {
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

    const redactionUrl = requireSafe(outputs, 'RedactionURL');
    const documentsBucket = requireSafe(outputs, 'FoiDocumentsBucket');

    // (a) FunctionURL reachable; 403 would mean the dual-permission setup regressed.
    const resp = await request.get(redactionUrl, { failOnStatusCode: false });
    expect(resp.status(), 'FunctionURL 403 — InvokeFunctionUrl/InvokeFunction perms regressed').not.toBe(403);
    expect(resp.status(), 'FunctionURL 5xx').toBeLessThan(500);

    // (d) Bucket Output non-empty.
    expect(documentsBucket, 'FoiDocumentsBucket Output empty').toMatch(/^.+$/);
  });
});
