import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Discover the umbrella Output keys at test time. The template uses CFN intrinsics
// (!Sub, !GetAtt) that real YAML loaders trip over, so regex the Outputs block:
// the keys are 2-space-indent lines under `Outputs:`.
function discoverAllDemoOutputKeys(): string[] {
  const templatePath = path.resolve(__dirname, 'template.yaml');
  const content = fs.readFileSync(templatePath, 'utf8');
  const outputsIdx = content.indexOf('\nOutputs:');
  if (outputsIdx < 0) throw new Error('Outputs: section not found in all-demo/template.yaml');
  const keys: string[] = [];
  for (const line of content.slice(outputsIdx).split('\n')) {
    const m = line.match(/^ {2}([A-Za-z][A-Za-z0-9]*):\s*$/);
    if (m) keys.push(m[1]);
  }
  if (keys.length === 0) throw new Error('Discovered zero Output keys in all-demo/template.yaml');
  return keys;
}

const URL_OUTPUT_PATTERN = /Url$|URL$/;

runSmoke({
  scenario: 'all-demo',
  test: async ({ outputs }) => {
    const expectedKeys = discoverAllDemoOutputKeys();
    expect(expectedKeys.length).toBeGreaterThan(10);

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
        expect(o.length, `${key} sensitive value too short`).toBeGreaterThan(0);
      }
    }
  },
});
