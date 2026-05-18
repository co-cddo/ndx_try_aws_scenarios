#!/usr/bin/env node
// Strips CDK bootstrap cruft from a synthesised template and writes the
// result to template.yaml (JSON content; CFN accepts JSON-in-.yaml).
//
// Usage: STACK=<StackName> CWD=<scenario dir> node strip-cdk-template.cjs

const fs = require('fs');

const stack = process.env.STACK;
if (!stack) {
  console.error('STACK env var required');
  process.exit(1);
}

const input = `cdk.out/${stack}.template.json`;
const t = JSON.parse(fs.readFileSync(input, 'utf8'));
delete t.Parameters?.BootstrapVersion;
delete t.Resources?.CDKMetadata;
delete t.Rules?.CheckBootstrapVersion;
const content = '# Auto-generated from CDK synthesis. Do not edit.\n' + JSON.stringify(t, null, 2);
fs.writeFileSync('template.yaml', content);
console.log(`Wrote template.yaml (${Buffer.byteLength(content)} bytes, ${Object.keys(t.Resources || {}).length} resources)`);
