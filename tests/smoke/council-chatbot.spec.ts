/**
 * Council Chatbot smoke spec.
 *
 * Auth mode: public — Lambda FunctionURL.
 *
 * Bug-informed feature flow: Bedrock Knowledge Base + S3 data source.
 * The chatbot Lambda invokes Bedrock with a Knowledge Base ID supplied
 * via env var. If the KB ingestion has not run or the model the chatbot
 * uses is the legacy claude-3-haiku-20240307 (now retired per the
 * Bedrock-legacy gotcha in the runbook), the FunctionURL returns 5xx.
 * Smoke does a GET against the URL (chat usually exposes a static UI on
 * GET) and asserts the KnowledgeBaseBucket Output is non-empty.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'council-chatbot';

test.describe(SCENARIO, () => {
  test('chatbot FunctionURL + KB bucket present', async ({ request }) => {
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

    const chatbotUrl = requireSafe(outputs, 'ChatbotURL');
    const kbBucket = requireSafe(outputs, 'ChatbotKnowledgeBaseBucket');

    const resp = await request.get(chatbotUrl, { failOnStatusCode: false });
    expect(resp.status(), 'chatbot FunctionURL 5xx (likely Bedrock-legacy regression — see NAP-548)').toBeLessThan(500);
    expect(resp.status(), 'chatbot FunctionURL 403 — public-Lambda perms regressed').not.toBe(403);
    expect(kbBucket, 'KnowledgeBaseBucket Output empty').toMatch(/^.+$/);
  });
});
