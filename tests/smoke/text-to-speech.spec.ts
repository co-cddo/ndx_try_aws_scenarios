/**
 * Text-to-Speech smoke spec.
 *
 * Auth mode: public — Lambda FunctionURL backed by Amazon Polly.
 *
 * Bug-informed feature flow: like the other public-Lambda scenarios,
 * the smoke checks that the FunctionURL is reachable (not 403, which
 * would indicate the InvokeFunctionUrl/InvokeFunction dual-perm regress).
 * AudioBucket Output is asserted for deploy completeness.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'text-to-speech';

test.describe(SCENARIO, () => {
  test('convert FunctionURL + AudioBucket present', async ({ request }) => {
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

    const convertUrl = requireSafe(outputs, 'TextToSpeechConvertURL');
    const audioBucket = requireSafe(outputs, 'TextToSpeechAudioBucket');

    const resp = await request.get(convertUrl, { failOnStatusCode: false });
    expect(resp.status(), 'convert FunctionURL 5xx').toBeLessThan(500);
    expect(resp.status(), 'convert FunctionURL 403 — public-Lambda perms regressed').not.toBe(403);
    expect(audioBucket, 'AudioBucket empty').toMatch(/^.+$/);
  });
});
