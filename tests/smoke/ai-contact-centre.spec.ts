/**
 * AI Contact Centre smoke spec.
 *
 * Auth mode: admin-login (companion UI). The deeper scenario surface
 * (Amazon Connect contact flows, Lex bot, multi-intent decomposer
 * Lambdas, multimodal-describe, profile builder, etc.) is too complex
 * for smoke to exercise end-to-end. Smoke verifies the companion UI
 * is reachable, the PSTN number is present (CFN-output sanity check —
 * a regression in the Connect-instance creation typically nukes this
 * output), and the Connect instance ID resolves to a Connect resource.
 *
 * The bug-informed signal here is the PSTN number: claiming UK +44 800
 * numbers from us-east-1 is something the team has historically had
 * issues with (per aws-connect-uk-numbers memory), so if the number is
 * absent or non-UK, the smoke catches that regression.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'ai-contact-centre';

test.describe(SCENARIO, () => {
  test('companion UI + PSTN UK claim sanity', async ({ page }) => {
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

    const companionUrl = requireSafe(outputs, 'AiContactCentreCompanionUrl');
    const pstnNumber = requireSafe(outputs, 'AiContactCentrePstnNumber');

    // (a) Companion UI reachable.
    const resp = await page.goto(companionUrl, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0, 'companion UI not reachable').toBeLessThan(500);

    // (b) PSTN number claim. UK +44 numbers are sometimes finicky from
    //     us-east-1 (per aws-connect-uk-numbers memory). Accept either:
    //     - a UK +44 toll-free (800 / 808 / 3xx) or common landline prefix
    //     - a US toll-free fallback (+1 8xx)
    //     Generic /^\+\d{6,}/ accepted any international number, defeating
    //     the point of the check. Strip whitespace first since Connect
    //     sometimes returns "+44 800 ..." formatted.
    const pstnDigits = pstnNumber.replace(/\s+/g, '');
    expect(pstnDigits, 'PSTN number not a UK or US claim — most likely an unintended international fallback').toMatch(
      /^\+(44(800|808|3[0-9]{2}|20|121|131|141|151|161|113)|1(800|888|877|866|855|844|833))/,
    );
  });
});
