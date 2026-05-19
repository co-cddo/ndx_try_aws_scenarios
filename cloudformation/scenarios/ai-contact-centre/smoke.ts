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
  outputAliases: {
    AiContactCentreCompanionUrl: 'CompanionUrl',
    AiContactCentrePstnNumber: 'PstnNumber',
  },
  // Smoke deploys AICC with a placeholder ExistingPhoneNumberArn (DUMMY string)
  // so the `ClaimNewPhoneNumber` condition is false: no real GB DID claim, no
  // GeoFlowAssoc. AICC's ConnectInstance + Lex + Wisdom + KB + companion UI all
  // deploy real, persist via fix-forward. Smoke checks the companion URL HTTP
  // status and that PstnNumber matches a +44 format string. UK DID claim quota
  // (5/30days) is preserved entirely for production deploys.
  test: async ({ page, get }) => {
    const companionUrl = get('AiContactCentreCompanionUrl');

    // PSTN format check (cheap, run first so failure is fast).
    expect(get('AiContactCentrePstnNumber').replace(/\s+/g, '')).toMatch(ACCEPTABLE_PSTN);

    // Load the SPA. It bootstraps `amazon-connect-chatjs` from unpkg + app.js
    // from the same CloudFront. A 5xx here means the static-assets path is
    // broken (BlueprintsBucketName regression) or the SPA's config fetch
    // failed (Cognito identity-pool regression).
    const resp = await page.goto(companionUrl, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await expect(page).toHaveTitle(/NDX:Try AI Contact Centre/i);

    // The welcome message is server-side wired (from the Connect contact flow
    // bootstrap); seeing it proves the SPA reached its config API and the
    // Connect instance is reachable. The "Ask" chat input is the entry point
    // for the WebSocket chat — its absence means the SPA crashed before render.
    await expect(page.locator('body'), 'companion welcome message missing — Connect bootstrap regression')
      .toContainText(/Aldershire District Council/i);
    await expect(page.locator('button:has-text("Ask"), button:has-text("Call via browser")').first())
      .toBeVisible();
  },
});
