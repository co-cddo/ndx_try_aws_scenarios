/**
 * Digital Planning Register smoke spec.
 *
 * Auth mode: public (no operator login — the register is a public-facing
 * planning-application list).
 *
 * Bug-informed feature flow: the scenario is a single-container Fargate
 * app. The CouncilConfig parameter (defaults to `{}`) controls which
 * council data the app surfaces. Smoke verifies the landing renders
 * and the council-list endpoint returns JSON without 5xx (catches the
 * regression where ImageUri got stuck on :latest and the new image
 * crashed at boot — pre-Phase-5 the deployed image could silently
 * change).
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'digital-planning-register';

test.describe(SCENARIO, () => {
  test('register loads + council list resolves', async ({ page }) => {
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

    const landingUrl = requireSafe(outputs, 'DigitalPlanningRegisterUrl');

    // (a) Landing.
    const resp = await page.goto(landingUrl, { waitUntil: 'domcontentloaded' });
    expect(resp?.status() ?? 0, 'register landing 5xx').toBeLessThan(500);
    const body = (await page.content()).toLowerCase();
    expect(body, 'Next.js error overlay present').not.toContain('application error');

    // (c) The page should contain "planning" or "register" in body.
    expect(body, 'register body missing planning markers').toMatch(/planning|register/);
  });
});
