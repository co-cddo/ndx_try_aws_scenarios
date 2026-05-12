/**
 * Planning AI smoke spec.
 *
 * Auth mode: public — Lambda FunctionURL. No login flow.
 *
 * Bug-informed feature flow: the deployed Lambda reads a sample PDF
 * from a CFN-injected location and a Textract-extracted text body
 * embedded in the template by build-template.py. If the build script
 * failed to inject the PDF or text, the Lambda boots but the analyzer
 * endpoint returns errors. Smoke verifies the AnalyzerURL responds and
 * the DocumentsBucket Output is non-empty.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'planning-ai';

test.describe(SCENARIO, () => {
  test('analyzer FunctionURL + DocumentsBucket present', async ({ request }) => {
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

    const analyzerUrl = requireSafe(outputs, 'PlanningAnalyzerURL');
    const docsBucket = requireSafe(outputs, 'PlanningDocumentsBucket');

    const resp = await request.get(analyzerUrl, { failOnStatusCode: false });
    expect(resp.status(), 'analyzer FunctionURL 5xx').toBeLessThan(500);
    expect(resp.status(), 'analyzer FunctionURL 403 — public-Lambda perms regressed').not.toBe(403);
    expect(docsBucket, 'DocumentsBucket empty').toMatch(/^.+$/);
  });
});
