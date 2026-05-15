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
  // Pre-claimed PSTN holder is live (see Step 13 of smoke-test-account-setup.md)
  // and a quota-increase request raising Connect instance count 1→2 (L-AA17A6B9)
  // is APPROVED but propagation is incomplete — the live value still reads 1 so
  // AICC create-instance hits "Quota limit reached" while the holder occupies
  // the slot. Re-engage by setting state:'active' once the live quota reads 2.
  quarantine: { state: 'quarantined', until: '2026-07-01', reason: 'Connect quota L-AA17A6B9 approved but not yet propagated; holder occupies slot 1' },
  test: async ({ page, get }) => {
    const resp = await page.goto(get('AiContactCentreCompanionUrl'), { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);

    expect(get('AiContactCentrePstnNumber').replace(/\s+/g, '')).toMatch(ACCEPTABLE_PSTN);
  },
});
