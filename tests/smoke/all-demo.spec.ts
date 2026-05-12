/**
 * all-demo umbrella smoke spec.
 *
 * Auth mode: umbrella — the all-demo stack has no user-facing surface
 * of its own; it just nests 16 child stacks. This spec asserts every
 * Output the all-demo template promises to surface is present and
 * non-empty, catching:
 *
 * - A nested-stack template URL that 404'd in S3 (deploy-blueprints
 *   didn't upload one or the path convention regressed)
 * - A nested stack that succeeded CREATE_COMPLETE but the all-demo
 *   GetAtt was misspelled / referenced a non-existent child Output
 * - A child stack that returned an Output as "{{resolve:...}}" literal
 *   instead of the resolved value
 *
 * Historical regression: during T3.8 verification (PR #233 comment),
 * the deploy failed because LocalgovIms required GovUkPayApiKey to be
 * non-empty. The umbrella check would have caught that earlier than the
 * deploy-time CFN failure if the spec had been authored — adding the
 * deploy-completeness check here closes that gap for future regressions.
 */

import { test, expect } from '@playwright/test';

import { fetchStackOutputs, requireSafe } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'all-demo';

// Every Output the all-demo umbrella template promises to surface.
// Keep in sync with cloudformation/scenarios/all-demo/template.yaml.
const REQUIRED_URL_OUTPUTS = [
  // Original 7 (pre-Phase-2b)
  'ChatbotURL',
  'RedactionURL',
  'PlanningAnalyzerURL',
  'QuicksightDashboardUrl',
  'SmartCarParkDashboardURL',
  'TextToSpeechConvertURL',
  'DrupalUrl',
  // Phase 2b expansion (9 new)
  'SimplyReadableAppUrl',
  'AiContactCentreCompanionUrl',
  'LocalgovImsAdminPortalUrl',
  'LocalgovImsPaymentPortalUrl',
  'MinuteUrl',
  'FixMyStreetUrl',
  'PaperlessNgxUrl',
  'PlanXUrl',
  'BopsPlanningUrl',
  'DigitalPlanningRegisterUrl',
];

const REQUIRED_OTHER_OUTPUTS = [
  'ChatbotKnowledgeBaseBucket',
  'FoiDocumentsBucket',
  'PlanningDocumentsBucket',
  'QuicksightDataBucket',
  'SmartCarParkSensorReadingsTable',
  'TextToSpeechAudioBucket',
  'AiContactCentrePstnNumber',
  'ScenarioInfo',
];

test.describe(SCENARIO, () => {
  test('every all-demo Output present + URLs are absolute https', async () => {
    const row = requireAssertionBar(SCENARIO);
    if (row.quarantine.state === 'quarantined') {
      test.skip(true, `Quarantined until ${row.quarantine.until}: ${row.quarantine.reason}`);
    }

    const outputs = await fetchStackOutputs({
      stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
      region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
    });

    // Every URL Output is a present, absolute https URL.
    for (const key of REQUIRED_URL_OUTPUTS) {
      const o = outputs[key];
      expect(o, `all-demo Output ${key} missing — nested stack output regressed`).toBeDefined();
      if (o?.kind === 'safe') {
        expect(o.value, `${key} not an https URL`).toMatch(/^https?:\/\//);
        expect(o.value, `${key} is the resolve token literal`).not.toMatch(/\{\{resolve:/);
      }
    }

    // Every other Output is present and non-empty.
    for (const key of REQUIRED_OTHER_OUTPUTS) {
      const o = outputs[key];
      expect(o, `all-demo Output ${key} missing — nested stack output regressed`).toBeDefined();
      if (o?.kind === 'safe') {
        expect(o.value.length, `${key} empty`).toBeGreaterThan(0);
        expect(o.value, `${key} is the resolve token literal`).not.toMatch(/\{\{resolve:/);
      }
    }
  });
});
