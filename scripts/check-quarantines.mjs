#!/usr/bin/env node
// Scans cloudformation/scenarios/*/smoke.ts for quarantine: blocks.
// Fails if any until-date has passed, or if > MAX_QUARANTINES are concurrent.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_QUARANTINES = Number(process.env.MAX_QUARANTINES ?? 3);
const SCENARIOS = 'cloudformation/scenarios';

const today = new Date().toISOString().slice(0, 10);
const expired = [];
let total = 0;

for (const name of readdirSync(SCENARIOS)) {
  const smokeFile = join(SCENARIOS, name, 'smoke.ts');
  let src;
  try {
    if (!statSync(smokeFile).isFile()) continue;
    src = readFileSync(smokeFile, 'utf8');
  } catch {
    continue;
  }
  const re = /state:\s*['"]quarantined['"][^}]*until:\s*['"]([0-9-]+)['"][^}]*reason:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    total++;
    if (m[1] < today) expired.push({ scenario: name, date: m[1], reason: m[2] });
  }
}

if (expired.length > 0) {
  console.error('FAILURE: quarantined scenarios have passed their until-date:');
  for (const e of expired) console.error(`  - ${e.scenario} (until ${e.date}): ${e.reason}`);
  process.exit(1);
}
if (total > MAX_QUARANTINES) {
  console.error(`FAILURE: ${total} scenarios quarantined concurrently; cap is ${MAX_QUARANTINES}`);
  process.exit(1);
}
console.log(`Quarantine check: ${total} active quarantine(s) within cap ${MAX_QUARANTINES}.`);
