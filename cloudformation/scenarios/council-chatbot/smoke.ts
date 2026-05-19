import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'council-chatbot',
  outputs: ['ChatbotURL', 'ChatbotKnowledgeBaseBucket'],
  outputAliases: {
    ChatbotKnowledgeBaseBucket: 'KnowledgeBaseBucket',
  },
  test: async ({ request, get }) => {
    const url = get('ChatbotURL');

    // First turn: ask a question the seeded KB has a documented answer for.
    // The response is the actual chatbot answer (not just a 200) — the seed
    // KB regression manifests as either {success:false} or as `citations:0`.
    const first = await request.post(url, {
      headers: { 'Content-Type': 'application/json' },
      data: { message: 'What are the bin collection days?', sessionId: 'smoke-test-1' },
      failOnStatusCode: false,
    });
    expect(first.status(), 'first POST status').toBeLessThan(500);
    expect(first.status(), 'first POST not 403 — public Lambda URL needs InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl since Oct 2025; see memory:isb_blocks_public_lambda_urls').not.toBe(403);

    const body = await first.json() as {
      success: boolean;
      response: string;
      sessionId: string;
      citations: number;
      query: string;
      model: string;
    };
    expect(body.success, `chatbot returned success:false — Bedrock invocation or KB retrieval regressed: ${JSON.stringify(body).slice(0, 200)}`).toBe(true);
    expect(body.response.length, 'chatbot returned empty response').toBeGreaterThan(20);
    expect(body.citations, 'chatbot returned zero citations — KB seed missing or vector index empty').toBeGreaterThan(0);
    expect(body.model, 'model field empty in response').toMatch(/.+/);
    expect(body.query).toContain('bin collection');

    // Second turn with the SAME sessionId from the first response: verifies
    // session state is persisted (DynamoDB or in-memory). A regression of the
    // session-store dependency would surface as sessionId not round-tripping
    // or as a fresh session being created.
    const second = await request.post(url, {
      headers: { 'Content-Type': 'application/json' },
      data: { message: 'And recycling?', sessionId: body.sessionId },
      failOnStatusCode: false,
    });
    expect(second.status()).toBeLessThan(500);
    const second_body = await second.json() as { success: boolean; sessionId: string };
    expect(second_body.success).toBe(true);
    expect(second_body.sessionId, 'second turn dropped the sessionId — session-store regression').toBe(body.sessionId);
  },
});
