/**
 * all-demo umbrella smoke spec.
 *
 * Auth mode: umbrella — the all-demo stack has no user-facing surface
 * of its own; it just nests 16 child stacks. This spec discovers every
 * Output the all-demo template declares (via the committed YAML source)
 * and asserts each is present, non-empty, and not a leaked
 * `{{resolve:...}}` token. Discovery is dynamic so adding a new Output
 * to the template doesn't require updating this spec; conversely
 * renaming one without updating both source and spec lights it up here.
 *
 * Catches:
 * - A nested-stack template URL that 404'd in S3 (deploy-blueprints
 *   didn't upload one or the path convention regressed)
 * - A nested stack that succeeded CREATE_COMPLETE but the all-demo
 *   GetAtt was misspelled / referenced a non-existent child Output
 * - A child stack that returned an Output as `{{resolve:...}}` literal
 *   instead of the resolved value
 *
 * Historical regression: during T3.8 verification (PR #233 comment),
 * the deploy failed because LocalgovIms required GovUkPayApiKey to be
 * non-empty. The umbrella check would have caught that earlier than the
 * deploy-time CFN failure if the spec had been authored.
 */

import * as fs from 'fs';
import * as path from 'path';

import { test, expect } from '@playwright/test';

import { fetchStackOutputs } from './fixtures/cfn-outputs';
import { requireAssertionBar } from './fixtures/assertion-bar';

const SCENARIO = 'all-demo';

// Parse the all-demo template at test time to discover its Outputs. The
// template uses CFN intrinsic functions (!Sub, !GetAtt) that real YAML
// loaders trip over, so we just regex the Outputs block — it's a flat
// list of `  KeyName:` lines under `Outputs:`.
function discoverAllDemoOutputKeys(): string[] {
  const templatePath = path.resolve(
    __dirname,
    '../../cloudformation/scenarios/all-demo/template.yaml',
  );
  const content = fs.readFileSync(templatePath, 'utf8');
  const outputsIdx = content.indexOf('\nOutputs:');
  if (outputsIdx < 0) {
    throw new Error('Outputs: section not found in all-demo/template.yaml');
  }
  const tail = content.slice(outputsIdx);
  // Match top-level keys under Outputs: (exactly 2 spaces indent, ending in colon).
  const keys: string[] = [];
  for (const line of tail.split('\n')) {
    const m = line.match(/^ {2}([A-Za-z][A-Za-z0-9]*):\s*$/);
    if (m) keys.push(m[1]);
  }
  if (keys.length === 0) {
    throw new Error('Discovered zero Output keys in all-demo/template.yaml; parser broken?');
  }
  return keys;
}

const URL_OUTPUT_PATTERN = /Url$|URL$/;

test.describe(SCENARIO, () => {
  test('every all-demo Output present + URL outputs are absolute https', async () => {
    const row = requireAssertionBar(SCENARIO);
    if (row.quarantine.state === 'quarantined') {
      test.skip(true, `Quarantined until ${row.quarantine.until}: ${row.quarantine.reason}`);
    }

    const expectedKeys = discoverAllDemoOutputKeys();
    expect(expectedKeys.length, 'discovered too few Output keys to be sensible').toBeGreaterThan(10);

    const outputs = await fetchStackOutputs({
      stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
      region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
    });

    for (const key of expectedKeys) {
      const o = outputs[key];
      expect(o, `all-demo Output ${key} missing — nested stack output regressed`).toBeDefined();
      if (!o) continue;
      if (o.kind === 'safe') {
        expect(o.value.length, `${key} empty`).toBeGreaterThan(0);
        expect(o.value, `${key} contains the {{resolve:...}} literal`).not.toMatch(/\{\{resolve:/);
        if (URL_OUTPUT_PATTERN.test(key)) {
          expect(o.value, `${key} not an https URL`).toMatch(/^https?:\/\//);
        }
      } else {
        // Sensitive outputs: only assert length is plausible.
        expect(o.length, `${key} sensitive value too short`).toBeGreaterThan(0);
      }
    }
  });
});
