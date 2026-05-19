import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'foi-redaction',
  outputs: ['RedactionURL', 'FoiDocumentsBucket'],
  outputAliases: {
    FoiDocumentsBucket: 'DocumentsBucket',
  },
  test: async ({ request, get }) => {
    const url = get('RedactionURL');

    // The frontend POSTs the document text back to the same URL as JSON.
    // Synthetic PII covering each Comprehend entity type we expect to redact.
    const sample = 'My name is John Smith and I live at 10 Downing Street, London SW1A 2AA. Phone: 020 7946 0958. Email: john.smith@example.gov.uk';
    const resp = await request.post(url, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: sample },
      failOnStatusCode: false,
    });
    expect(resp.status()).toBeLessThan(500);
    expect(resp.status(), 'public Lambda URL needs both InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl perms').not.toBe(403);

    const body = await resp.json() as {
      success: boolean;
      redactedText: string;
      redactionCount: number;
      redactions: ReadonlyArray<{ type: string; confidence: number; original_length: number }>;
      originalLength: number;
      confidenceThreshold: number;
    };
    expect(body.success, `redaction failed: ${JSON.stringify(body).slice(0, 200)}`).toBe(true);
    expect(body.redactionCount, 'zero redactions found — Comprehend or model regression').toBeGreaterThan(0);
    expect(body.redactedText, 'redacted text still contains original PII (John Smith)').not.toContain('John Smith');
    expect(body.redactedText, 'redacted text still contains original PII (postcode)').not.toContain('SW1A 2AA');
    expect(body.redactedText, 'redacted text still contains original email').not.toContain('@example.gov.uk');
    expect(body.redactedText).toContain('[REDACTED');
    const types = body.redactions.map((r) => r.type);
    expect(types, 'NAME entity not detected').toContain('NAME');
    expect(types, 'EMAIL entity not detected').toContain('EMAIL');
  },
});
