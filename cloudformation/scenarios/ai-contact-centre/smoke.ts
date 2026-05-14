import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

// UK +44 number claim from us-east-1 is finicky (memory:aws-connect-uk-numbers).
// Accept either UK +44 (toll-free / common landline) or US +1 (toll-free
// fallback). Generic /^\+\d{6,}/ matched any international number and
// defeated the point of the check.
const ACCEPTABLE_PSTN = /^\+(44(800|808|3[0-9]{2}|20|121|131|141|151|161|113)|1(800|888|877|866|855|844|833))/;

runSmoke({
  scenario: 'ai-contact-centre',
  outputs: ['AiContactCentreCompanionUrl', 'AiContactCentrePstnNumber'],
  // Quarantined until the smoke account has a long-lived "holder" Connect
  // instance with a pre-claimed PSTN number wired into the all-demo deploy.
  // The template change in this PR adds the ExistingPhoneNumberArn /
  // ExistingPhoneNumber parameters; the operator runbook step that creates
  // the holder + claims the number is still TODO (needs to run from CI as
  // the SmokeTestDeployRole because the smoke account's Restrictions SCP
  // blocks connect:CreateInstance from non-InnovationSandbox-ndx-* roles).
  // Until then, every smoke run would claim+release a UK +44 DID and exhaust
  // the 30-day cooldown quota.
  quarantine: { state: 'quarantined', until: '2026-07-01', reason: 'pre-claimed PSTN setup pending; otherwise quota burn' },
  test: async ({ page, get }) => {
    const resp = await page.goto(get('AiContactCentreCompanionUrl'), { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);

    expect(get('AiContactCentrePstnNumber').replace(/\s+/g, '')).toMatch(ACCEPTABLE_PSTN);
  },
});
