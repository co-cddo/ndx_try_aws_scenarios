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
  test: async ({ page, get }) => {
    const resp = await page.goto(get('AiContactCentreCompanionUrl'), { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);

    expect(get('AiContactCentrePstnNumber').replace(/\s+/g, '')).toMatch(ACCEPTABLE_PSTN);
  },
});
