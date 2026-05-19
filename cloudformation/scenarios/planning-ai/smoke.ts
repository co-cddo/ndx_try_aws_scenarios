import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'planning-ai',
  outputs: ['PlanningAnalyzerURL', 'PlanningDocumentsBucket'],
  outputAliases: {
    PlanningAnalyzerURL: 'AnalyzerURL',
    PlanningDocumentsBucket: 'DocumentsBucket',
  },
  test: async ({ request, get }) => {
    const url = get('PlanningAnalyzerURL');

    // useSample:true makes the Lambda run Textract + Bedrock against the
    // sample planning application bundled in the docs bucket. This exercises
    // the full pipeline: S3 read, Textract OCR, Bedrock structured-extraction,
    // and the response shape the frontend renders.
    const resp = await request.post(url, {
      headers: { 'Content-Type': 'application/json' },
      data: { useSample: true },
      timeout: 90_000,
      failOnStatusCode: false,
    });
    expect(resp.status()).toBeLessThan(500);
    expect(resp.status(), 'public Lambda URL needs both InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl perms').not.toBe(403);

    const body = await resp.json() as {
      success: boolean;
      extractedData: { applicationRef?: string; siteAddress?: string };
      aiAnalysis: {
        summary?: string;
        completeness?: { status: string };
        classification?: { applicationType: string };
      };
      textractStats: { lineCount: number; wordCount: number; avgConfidence: number };
    };
    expect(body.success, `analysis failed: ${JSON.stringify(body).slice(0, 200)}`).toBe(true);
    // Textract has to extract real text — empty stats means OCR didn't run.
    expect(body.textractStats.wordCount, 'Textract returned zero words — OCR regression').toBeGreaterThan(100);
    expect(body.textractStats.avgConfidence, 'Textract confidence below 80% — model regression').toBeGreaterThan(80);
    // Bedrock has to produce structured extraction.
    expect(body.extractedData.applicationRef, 'Bedrock failed to extract applicationRef').toMatch(/PA\//);
    expect(body.aiAnalysis.summary?.length ?? 0, 'AI summary empty — Bedrock model unavailable').toBeGreaterThan(50);
    expect(body.aiAnalysis.classification?.applicationType, 'AI classification field missing').toBeTruthy();
  },
});
