---
title: 'Convert LocalGov Drupal Template to ISB Blueprint'
slug: 'localgov-drupal-isb-blueprint'
created: '2026-02-27'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'AWS CDK (TypeScript) for localgov-drupal infrastructure'
  - 'AWS CDK (TypeScript) for ISB hub management'
  - 'CloudFormation StackSets (self-managed via ISB)'
  - 'AWS Innovation Sandbox (ISB) blueprints'
  - 'Eleventy (11ty) static site with YAML data files'
files_to_modify:
  - 'cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts'
  - 'cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts'
  - 'cloudformation/scenarios/localgov-drupal/cdk/bin/app.ts'
  - 'cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/database.ts'
  - 'cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/storage.ts'
  - 'cloudformation/isb-hub/lib/isb-hub-stack.ts'
  - '.github/workflows/deploy-blueprints.yml'
  - 'src/_data/scenarios.yaml'
files_to_delete:
  - 'cloudformation/scenarios/localgov-drupal/template.yaml'
files_to_create:
  - 'cloudformation/scenarios/localgov-drupal/BLUEPRINT.md'
code_patterns:
  - 'CDK modular construct architecture (networking, database, storage, compute, cloudfront)'
  - 'ISB hub CDK app manages StackSets and S3 template uploads via BucketDeployment'
  - 'Admin password currently generated at CDK-synth time via Math.random() — needs to move to CloudFormation deploy-time'
  - 'DB password already uses Secrets Manager (CloudFormation deploy-time) — established pattern to follow'
  - 'IAM role names follow SCP pattern: InnovationSandbox-ndx-{deploymentMode}-exec/task'
  - 'Container image from ghcr.io (public registry, no ECR dependency)'
  - 'DeploymentMode currently CDK context — hardcode to production (ISB deployments are always demos)'
  - 'councilTheme currently CDK context — hardcode to random'
  - 'No template.yaml in git — CI synths CDK app, strips bootstrap cruft, hub CDK uploads to S3'
  - 'All removal policies hardcode to DESTROY — ISB handles cleanup via AWS Nuke'
  - 'deploy-blueprints.yml needs localgov-drupal CDK synth step before hub CDK deploy'
test_patterns:
  - 'No CloudFormation template unit tests exist'
  - 'Portal tests are Playwright screenshot/visual regression only'
  - 'Schema validation runs at build time via scenarios.yaml schema'
  - 'npm run build validates schema + Eleventy'
---

# Tech-Spec: Convert LocalGov Drupal Template to ISB Blueprint

**Created:** 2026-02-27

## Overview

### Problem Statement

The localgov-drupal scenario's CloudFormation template is a CDK-generated stub (618 bytes, no actual resources). It needs a full synthesis, CDK bootstrap dependencies stripped, admin password generation moved from CDK-time to CloudFormation deploy-time (security fix — every StackSet deployment would otherwise share the same baked-in password), and integration into the ISB hub CDK app alongside the other 6 scenarios.

### Solution

Modify the CDK app to be ISB-compatible (Secrets Manager for admin password, hardcode deploymentMode to 'production' and councilTheme to 'random', all removal policies to DESTROY). Remove the stub template.yaml from git — CI will synthesize the CDK app, strip bootstrap cruft, and the ISB hub CDK uploads the result to S3. Add localgov-drupal to the ISB hub CDK app, create BLUEPRINT.md, and update scenarios.yaml.

### Scope

**In Scope:**

- Modify CDK app: admin password via Secrets Manager, hardcode deploymentMode to 'production', hardcode councilTheme to 'random'
- Hardcode all removal policies to DESTROY (ISB handles cleanup via AWS Nuke)
- Delete stub template.yaml from git, add to .gitignore
- Update deploy-blueprints CI workflow: add CDK synth step that builds template at CI time, strips bootstrap cruft, writes ephemeral template.yaml for hub CDK to upload
- Add localgov-drupal to ISB hub CDK app (BucketDeployment + CfnStackSet)
- Create BLUEPRINT.md for localgov-drupal
- Update scenarios.yaml (add CAPABILITY_NAMED_IAM)

**Out of Scope:**

- Changes to Drupal custom modules or container image
- Docker/container build changes
- ISB hub account setup or ISB installation
- Portal UI changes

## Context for Development

### Codebase Patterns

- CDK app at `cloudformation/scenarios/localgov-drupal/cdk/` with 5 modular constructs (networking, database, storage, compute, cloudfront)
- Admin password currently generated at CDK-synth time via `Math.random()` in `localgov-drupal-stack.ts` — baked into template as literal string
- DB password already uses Secrets Manager `generateSecretString` — resolved at CloudFormation deploy-time
- Container uses `unsafeUnwrap()` on Secrets Manager references to inject DB credentials as environment variables via CloudFormation dynamic references
- ISB hub CDK app at `cloudformation/isb-hub/` manages 6 scenarios — localgov-drupal not yet included
- Portal expects 4 outputs: `DrupalUrl`, `AdminUsername`, `AdminPassword`, `CloudWatchLogsUrl`
- IAM role names use `InnovationSandbox-ndx-{deploymentMode}-exec/task` to match ISB SCP patterns
- No actual CDK assets (no Lambda code, container image from GHCR) — bootstrap dependency is purely cosmetic

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts` | Main stack — admin password generation, outputs, construct orchestration |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts` | Fargate service — IAM roles, container env vars, admin password injection |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/database.ts` | Aurora — Secrets Manager pattern for DB credentials (reference for admin password fix) |
| `cloudformation/scenarios/localgov-drupal/cdk/bin/app.ts` | Entry point — CDK context for deploymentMode and councilTheme |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/storage.ts` | EFS — removal policy to hardcode |
| `cloudformation/scenarios/localgov-drupal/cdk/cdk.json` | CDK config — confirms `"output": "../cdk.out"` (L33), used by CI strip script path |
| `cloudformation/scenarios/localgov-drupal/template.yaml` | Current stub (618 bytes) — to be deleted from git |
| `.github/workflows/deploy-blueprints.yml` | CI pipeline — add CDK synth step for localgov-drupal |
| `cloudformation/isb-hub/lib/isb-hub-stack.ts` | ISB hub — add localgov-drupal to scenarios array |
| `cloudformation/scenarios/council-chatbot/BLUEPRINT.md` | Reference BLUEPRINT.md pattern |
| `src/_data/scenarios.yaml` | Portal config — localgov-drupal deployment block |
| `_bmad-output/implementation-artifacts/tech-spec-isb-remaining-scenarios-ci.md` | Previous spec — established patterns and conventions |

### Technical Decisions

1. **Admin password via Secrets Manager** — Create a new `secretsmanager.Secret` in `localgov-drupal-stack.ts` following the exact pattern from `database.ts:68-77`. Do NOT set `secretName` — let CloudFormation generate a unique physical name to avoid name collisions on stack rollback/redeploy (Secrets Manager retains deleted secret names for 7-30 days) and to prevent `ResourceAlreadyExistsException` if the template is ever deployed twice in the same account. Use JSON template `{"username": "admin", "password": "..."}` for consistency with DB secret pattern. Pass the secret to `ComputeConstruct` as a new `adminSecret` prop (required `secretsmanager.ISecret`, not optional string). Compute uses `secretValueFromJson('password').unsafeUnwrap()` for the `ADMIN_PASSWORD` env var — remove the `if (props.adminPassword)` conditional guard. Stack output uses the same `unsafeUnwrap()` — CloudFormation resolves `{{resolve:secretsmanager:...}}` dynamic references in outputs at deploy time.
2. **Hardcode deploymentMode to 'production'** — ISB deployments are always demos. Eliminates conditional branching for backup retention, removal policies, container insights, etc. The `DeploymentMode` prop/interface remains but defaults to and is always 'production'. Remove CDK context lookup from `app.ts`.
3. **Hardcode councilTheme to 'random'** — Remove CDK context lookup from `app.ts`. Inline as `'random'` in stack props.
4. **All removal policies → DESTROY** — ISB handles cleanup via AWS Nuke on lease termination. No point in SNAPSHOT or RETAIN in a sandbox being terminated. Applies to Aurora cluster (`database.ts:108-111`) and EFS (`storage.ts:77-80`).
5. **No template.yaml in git** — CI synthesizes the CDK app at build time. The `cdk.json` outputs to `../cdk.out` (covered by `.gitignore`'s `cdk.out/`). Synth output at `../cdk.out/LocalGovDrupalStack.template.json` (relative to `cdk/` working dir). CI strips bootstrap cruft (BootstrapVersion parameter, CDKMetadata resource, CheckBootstrapVersion rule) and writes the result to `../template.yaml` as an ephemeral artifact. After stripping, validate no remaining `AssetParameters` or `cdk-bootstrap` references — fail CI if found (guardrail against future changes introducing real bootstrap dependencies). The ISB hub CDK's `BucketDeployment` picks it up with the same `Source.asset` pattern as every other scenario.
6. **ISB hub integration via SCENARIOS array** — Add `{ name: 'localgov-drupal', description: '...' }` to the `SCENARIOS` array in `isb-hub-stack.ts`. The existing loop handles BucketDeployment + CfnStackSet creation automatically. No special handling needed.
7. **CI workflow: separate synth job** — Add a new `synth-localgov-drupal` job to `deploy-blueprints.yml` that runs `npm ci` + `npx cdk synth`, strips bootstrap cruft, validates guardrails, and uploads the template as a GitHub Actions artifact. The existing `deploy` job depends on it via `needs:` and downloads the artifact. Add `cloudformation/scenarios/localgov-drupal/cdk/**` to the `paths` trigger (specific, not wildcard for all CDK scenarios — YAGNI).
8. **Delete stub template.yaml** — The current 618-byte stub is tracked in git. Delete it via `git rm`. The CI-generated ephemeral version lives in the same path but isn't committed.
9. **Backup retention stays at 7 days** — Even though deploymentMode is hardcoded to production, the 7-day backup retention is fine for demos (short-lived sandbox accounts). No need to reduce it.
10. **StackSet timeout note** — LocalGov Drupal takes 35-40 minutes to deploy (Aurora, Fargate, Drupal init, AI content generation). BLUEPRINT.md should recommend a 45-minute timeout, significantly longer than the 5 minutes used for SAM scenarios.

### Anchor Points (Line References)

| File | Line(s) | What | Change |
| ---- | ------- | ---- | ------ |
| `localgov-drupal-stack.ts` | L56 | `Math.random()` admin password | Replace with Secrets Manager secret |
| `localgov-drupal-stack.ts` | L94 | `adminPassword` prop to Compute | Change to `adminSecret` prop |
| `localgov-drupal-stack.ts` | L121-124 | AdminPassword output | Use `secretValueFromJson().unsafeUnwrap()` |
| `localgov-drupal-stack.ts` | L50 | `deploymentMode` from props | Hardcode to `'production'` |
| `localgov-drupal-stack.ts` | L53 | `councilTheme` from props | Hardcode to `'random'` |
| `compute.ts` | L67-69 | `adminPassword?: string` prop | Replace with `adminSecret: secretsmanager.ISecret` (required) |
| `compute.ts` | L272-274 | `ADMIN_PASSWORD` env var conditional | Remove guard, use `adminSecret.secretValueFromJson('password').unsafeUnwrap()` |
| `app.ts` | L9-14 | Context lookups for deploymentMode/councilTheme | Remove — hardcode in stack |
| `database.ts` | L104 | Backup retention conditional | Hardcode `cdk.Duration.days(7)` |
| `database.ts` | L108-111 | Removal policy conditional | Hardcode `cdk.RemovalPolicy.DESTROY` |
| `storage.ts` | L77-80 | Removal policy conditional | Hardcode `cdk.RemovalPolicy.DESTROY` |
| `isb-hub-stack.ts` | L16-23 | SCENARIOS array | Add localgov-drupal entry |
| `deploy-blueprints.yml` | L6-8 | paths trigger | Add `cloudformation/scenarios/localgov-drupal/cdk/**` |
| `deploy-blueprints.yml` | L19-40 | jobs section | Add separate `synth-localgov-drupal` job, add `needs:` to `deploy` job |
| `scenarios.yaml` | L75 | capabilities | Add `CAPABILITY_NAMED_IAM` + `CAPABILITY_AUTO_EXPAND` |

## Implementation Plan

### Tasks

- [x] Task 1: Simplify CDK entry point — remove context lookups
  - File: `cloudformation/scenarios/localgov-drupal/cdk/bin/app.ts`
  - Action: Remove the `deploymentMode` context/env lookup (L9-11) and `councilTheme` context lookup (L14). Hardcode values directly in the `LocalGovDrupalStack` instantiation: `deploymentMode: 'production'`, `councilTheme: 'random'`. Remove the now-unused type assertions.
  - Notes: The `LocalGovDrupalStackProps` interface keeps `deploymentMode?` and `councilTheme?` as optional props — they just always receive 'production' and 'random' from here.

- [x] Task 2: Replace admin password with Secrets Manager secret
  - File: `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts`
  - Action:
    1. Add import: `import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';`
    2. Replace the `Math.random()` admin password generation (L55-56) with a new Secrets Manager secret:
       ```typescript
       const adminSecret = new secretsmanager.Secret(this, 'AdminSecret', {
         // No secretName — CloudFormation generates unique name to avoid
         // collision on rollback (Secrets Manager 7-30 day recovery window)
         description: 'Admin credentials for LocalGov Drupal',
         generateSecretString: {
           secretStringTemplate: JSON.stringify({ username: 'admin' }),
           generateStringKey: 'password',
           excludePunctuation: true,
           passwordLength: 32,
         },
       });
       ```
    3. In the `ComputeConstruct` instantiation (L85-95), replace `adminPassword,` (L94) with `adminSecret,`
    4. Update the `AdminPassword` CfnOutput (L121-124): replace `value: adminPassword` with `value: adminSecret.secretValueFromJson('password').unsafeUnwrap()`
  - Notes: Pattern follows `database.ts:68-77` except `secretName` is omitted (CloudFormation auto-generates unique names, avoiding rollback/collision issues). The `unsafeUnwrap()` produces a CloudFormation `{{resolve:secretsmanager:...}}` dynamic reference — each StackSet deployment gets a unique password resolved at deploy time.

- [x] Task 3: Update compute construct to accept admin secret
  - File: `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts`
  - Action:
    1. In `ComputeConstructProps` interface: replace the `adminPassword` prop and its JSDoc comment (L65-69) with:
       ```typescript
       /**
        * Secrets Manager secret containing admin credentials.
        * Must contain JSON keys 'username' and 'password'.
        * Resolved at CloudFormation deploy time via dynamic reference.
        */
       readonly adminSecret: secretsmanager.ISecret;
       ```
    2. After the existing `props.databaseSecret.grantRead(executionRole);` (L146), add:
       ```typescript
       // Grant read for completeness — actual resolution is via CloudFormation dynamic reference
       props.adminSecret.grantRead(executionRole);
       ```
    3. Remove the conditional admin password block (L271-274):
       ```typescript
       // Remove this:
       if (props.adminPassword) {
         containerEnvironment.ADMIN_PASSWORD = props.adminPassword;
       }
       ```
    4. In the container environment object (L283-290), add `ADMIN_PASSWORD` alongside the DB credentials:
       ```typescript
       environment: {
         ...containerEnvironment,
         DB_USER: props.databaseSecret.secretValueFromJson('username').unsafeUnwrap(),
         DB_PASSWORD: props.databaseSecret.secretValueFromJson('password').unsafeUnwrap(),
         ADMIN_PASSWORD: props.adminSecret.secretValueFromJson('password').unsafeUnwrap(),
       },
       ```
  - Notes: The `adminSecret` import already exists at L9 (`import * as secretsmanager`). The `unsafeUnwrap()` pattern matches DB credentials at L288-289 — CloudFormation resolves the dynamic reference at deploy time, avoiding runtime `secretsmanager:GetSecretValue` calls (which sandbox SCPs block).

- [x] Task 4: Hardcode database removal policy and backup retention
  - File: `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/database.ts`
  - Action:
    1. Replace backup retention conditional (L104) with: `retention: cdk.Duration.days(7),`
    2. Replace removal policy conditional (L108-111) with: `removalPolicy: cdk.RemovalPolicy.DESTROY,`
  - Notes: 7-day backup retention is fine for short-lived ISB sandboxes. DESTROY ensures CloudFormation can clean up without manual intervention when ISB terminates the lease via AWS Nuke. The production value was SNAPSHOT — no point in a snapshot when the account is being nuked.

- [x] Task 5: Hardcode storage removal policy
  - File: `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/storage.ts`
  - Action: Replace the removal policy conditional (L77-80) with: `removalPolicy: cdk.RemovalPolicy.DESTROY,`
  - Notes: The production value was RETAIN — no point in retaining when the sandbox account is terminated.

- [x] Task 6: Delete stub template.yaml from git
  - File: `cloudformation/scenarios/localgov-drupal/template.yaml`
  - Action: Delete this file via `git rm`. It's a 618-byte CDK stub with no actual resources. The real template will be synthesized at CI time and never committed to git.
  - Notes: The `cdk.out/` directory is already in `.gitignore`. The CI-generated ephemeral `template.yaml` lives at `cloudformation/scenarios/localgov-drupal/template.yaml` but isn't committed — it's a build artifact consumed by the ISB hub CDK's `BucketDeployment`.

- [x] Task 7: Update CI workflow — add CDK synth and bootstrap strip
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action:
    1. Add to paths trigger (after L8): `- 'cloudformation/scenarios/localgov-drupal/cdk/**'`
    2. Split the existing `deploy` job into two jobs: `synth-localgov-drupal` (new) and `deploy` (existing, with `needs: synth-localgov-drupal`). This isolates CDK synth failures from the hub deploy — a synth failure produces a clear red flag without blocking other scenarios if the hub deploy is triggered by a non-CDK change.
    3. New `synth-localgov-drupal` job:
       ```yaml
       synth-localgov-drupal:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v6

           - uses: actions/setup-node@v6
             with:
               node-version: '20'
               cache: 'npm'
               cache-dependency-path: cloudformation/scenarios/localgov-drupal/cdk/package-lock.json

           - name: Synth localgov-drupal CDK
             working-directory: cloudformation/scenarios/localgov-drupal/cdk
             run: |
               npm ci
               npx cdk synth

           - name: Strip bootstrap cruft and validate template
             working-directory: cloudformation/scenarios/localgov-drupal/cdk
             run: |
               node -e "
                 const fs = require('fs');
                 const t = JSON.parse(fs.readFileSync('../cdk.out/LocalGovDrupalStack.template.json', 'utf8'));
                 delete t.Parameters?.BootstrapVersion;
                 delete t.Resources?.CDKMetadata;
                 delete t.Rules?.CheckBootstrapVersion;
                 const str = JSON.stringify(t);
                 const errors = [];
                 if (str.includes('AssetParameters') || str.includes('cdk-bootstrap')) {
                   errors.push('Template contains CDK bootstrap/asset dependencies');
                 }
                 if (!str.includes('secretsmanager')) {
                   errors.push('Template missing Secrets Manager resources (admin password not migrated)');
                 }
                 const deletionPolicies = str.match(/\"DeletionPolicy\":\s*\"(Snapshot|Retain)\"/g);
                 if (deletionPolicies) {
                   errors.push('Template contains non-DESTROY deletion policies: ' + deletionPolicies.join(', '));
                 }
                 const size = Buffer.byteLength(JSON.stringify(t, null, 2));
                 if (size > 400000) {
                   errors.push('Template size ' + size + ' bytes approaching CloudFormation S3 limit (460,800)');
                 }
                 if (errors.length > 0) {
                   errors.forEach(e => console.error('ERROR: ' + e));
                   process.exit(1);
                 }
                 // Write JSON content to .yaml — CloudFormation accepts both formats regardless of extension
                 // Prepend YAML comment for clarity since content is JSON
                 const content = '# Auto-generated from CDK synthesis. Do not edit.\\n' + JSON.stringify(t, null, 2);
                 fs.writeFileSync('../template.yaml', content);
                 console.log('Wrote template.yaml (' + size + ' bytes, ' + Object.keys(t.Resources || {}).length + ' resources)');
               "

           - uses: actions/upload-artifact@v4
             with:
               name: localgov-drupal-template
               path: cloudformation/scenarios/localgov-drupal/template.yaml
               retention-days: 1
       ```
    4. Update existing `deploy` job to depend on synth and download artifact:
       ```yaml
       deploy:
         needs: synth-localgov-drupal
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v6

           - uses: actions/download-artifact@v4
             with:
               name: localgov-drupal-template
               path: cloudformation/scenarios/localgov-drupal

           # ... rest of existing deploy steps unchanged ...
       ```
  - Notes: The synth output lands at `../cdk.out/LocalGovDrupalStack.template.json` (relative to `cdk/` working dir, because `cdk.json` has `"output": "../cdk.out"` — verified in `cdk.json:L33`). The artifact upload/download passes the template between jobs. The strip script validates four guardrails: (1) no CDK bootstrap/asset dependencies, (2) Secrets Manager resources present (positive check that migration is correct), (3) no `Snapshot` or `Retain` deletion policies, (4) template size under 400KB (warning threshold for 460KB CloudFormation S3 limit). The output file is JSON content with a YAML comment header — CloudFormation accepts both formats regardless of extension.

- [x] Task 8: Add localgov-drupal to ISB hub SCENARIOS array
  - File: `cloudformation/isb-hub/lib/isb-hub-stack.ts`
  - Action: Add to the SCENARIOS array (after L22, before the closing `];`):
    ```typescript
    { name: 'localgov-drupal', description: 'NDX:Try LocalGov Drupal - AI-enhanced CMS for UK councils' },
    ```
  - Notes: The existing loop at L39-59 handles BucketDeployment and L141-160 handles CfnStackSet creation — both will automatically process the new entry. No other changes needed in this file.

- [x] Task 9: Create BLUEPRINT.md for localgov-drupal
  - File: `cloudformation/scenarios/localgov-drupal/BLUEPRINT.md` (new file)
  - Action: Create following the pattern from `cloudformation/scenarios/council-chatbot/BLUEPRINT.md` with these localgov-drupal specifics:
    - Title: "ISB Blueprint Registration: LocalGov Drupal"
    - Prerequisites: include "Amazon Bedrock models (Nova Pro, Nova Canvas) enabled in target region"
    - StackSet name: `ndx-try-localgov-drupal`
    - Capabilities: `CAPABILITY_IAM CAPABILITY_NAMED_IAM` (NAMED_IAM because the template uses explicit IAM role names matching ISB SCP patterns; AUTO_EXPAND not needed — CDK-synthesized template contains no transforms)
    - Target region: `us-east-1` (Bedrock model availability)
    - Timeout recommendation: **45 minutes** (Aurora + Fargate + Drupal init + AI content generation)
    - Verification: check for CloudFront distribution, Aurora cluster, Fargate service, EFS file system; access Drupal via the CloudFront URL; verify admin login with credentials from Secrets Manager
  - Notes: This is a manual registration guide for ISB admins. The 45-minute timeout is significantly longer than the 5-minute timeout used for SAM-based scenarios because LocalGov Drupal includes database provisioning, container startup, Drupal installation, and AI content generation.

- [x] Task 10: Update scenarios.yaml deployment config
  - File: `src/_data/scenarios.yaml`
  - Action:
    1. Remove the `parameters` block (L63-66 — the `DeploymentMode` parameter) since the template no longer accepts CloudFormation parameters
    2. Update capabilities (L74-75) to include all three:
       ```yaml
       capabilities:
         - "CAPABILITY_IAM"
         - "CAPABILITY_NAMED_IAM"
       ```
  - Notes: `CAPABILITY_AUTO_EXPAND` removed — the CDK-synthesized template contains no transforms (no SAM, no `AWS::Include`). The template has no CloudFormation parameters (deploymentMode is resolved at CDK synth time, not deploy time). Keeping the `DeploymentMode` parameter would cause a CloudFormation error when the portal tries to create a stack with a parameter the template doesn't define.

### Acceptance Criteria

- [x] AC 1: Given the CDK app is synthesized, when examining the output template JSON, then no literal admin password string should appear — the AdminPassword output value must contain a Secrets Manager dynamic reference (`{{resolve:secretsmanager:...}}`)
- [x] AC 2: Given the template is deployed via StackSet, when CloudFormation creates resources, then a Secrets Manager secret should exist (CloudFormation-generated name) with JSON keys `username` (value: `admin`) and `password` (auto-generated 32-char string)
- [x] AC 3: Given the Fargate task definition is created, when examining the container environment variables, then `ADMIN_PASSWORD` should contain a CloudFormation dynamic reference resolving to the admin secret's password — not a plaintext string
- [x] AC 4: Given the CDK app is synthesized, when examining the template, then the Aurora cluster's `DeletionPolicy` should be `Delete` (not `Snapshot`) and the EFS file system's `DeletionPolicy` should be `Delete` (not `Retain`)
- [x] AC 5: Given the CI workflow runs the strip step, when the output `template.yaml` is validated, then it should contain zero references to `BootstrapVersion`, `CDKMetadata`, `CheckBootstrapVersion`, `AssetParameters`, or `cdk-bootstrap`
- [x] AC 6: Given a push to `cloudformation/scenarios/localgov-drupal/cdk/**` on main, when the deploy-blueprints workflow triggers, then it should successfully synth the CDK app, strip bootstrap cruft, write `template.yaml`, and deploy the ISB hub stack
- [x] AC 7: Given the ISB hub stack is deployed, when listing StackSets, then `ndx-try-localgov-drupal` should exist with `templateUrl` pointing to the blueprints S3 bucket at path `scenarios/localgov-drupal/template.yaml`
- [x] AC 8: Given `npm run build` is executed, when the scenarios.yaml schema validation runs, then localgov-drupal should validate with capabilities `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM` (no `CAPABILITY_AUTO_EXPAND` — no transforms) and no `DeploymentMode` parameter
- [x] AC 9: Given the synthesized template is deployed in a sandbox account, when Drupal initializes, then each deployment should have a unique admin password (different from any other sandbox deployment)

## Additional Context

### Dependencies

- **AWS CDK CLI** — Required in CI for `npx cdk synth`. Already available via `npm ci` in the CDK project directory (listed as a devDependency).
- **ISB hub account** — The hub account (568672915267) must have the OIDC provider and CDK bootstrap already configured. This is already in place for the existing 6 scenarios.
- **Amazon Bedrock models** — `amazon.nova-pro-v1:0` and `amazon.nova-canvas-v1:0` must be enabled in `us-east-1` in sandbox accounts for Drupal's AI features to work. This is an ISB admin configuration, not a code dependency.
- **Container image** — `ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov_drupal:latest` must be accessible from sandbox accounts (public registry, no authentication needed). Sandbox accounts need internet access (confirmed).
- **No new npm packages** — All required CDK modules (`aws-secretsmanager`, etc.) are already imported in the existing codebase. No package.json changes needed.

### Testing Strategy

- **CDK Synth validation**: Run `npx cdk synth` locally in `cloudformation/scenarios/localgov-drupal/cdk/` and verify the output template contains Secrets Manager resources, no bootstrap dependencies, and correct removal policies. This is the primary validation method.
- **Bootstrap strip verification**: Run the inline Node.js strip script against the synth output and verify no bootstrap/asset references remain. This is automated in CI as a guardrail.
- **Schema validation**: Run `npm run build` at the project root to validate `scenarios.yaml` against the schema. This catches capability and parameter mismatches.
- **No unit tests to add**: The project has no CloudFormation template unit tests (this is consistent across all 7 scenarios). The synth + strip + schema validation pipeline is the testing strategy.
- **Manual ISB testing**: After deployment, request a test lease via ISB, wait for deployment (~40 min), verify Drupal is accessible via CloudFront URL, verify admin login works with credentials from the stack outputs, and verify the admin password differs from any previous deployment.

### Notes

- **High-risk: Admin password migration** — The Secrets Manager approach is proven (identical pattern to DB credentials in the same codebase), but if the admin secret fails to create or resolve, Drupal will start without an admin password set. The container's init script should handle a missing `ADMIN_PASSWORD` env var gracefully (it currently defaults to a hardcoded fallback in the Drupal setup script). Verify this fallback still exists in the container image.
- **CDK synth in CI** — This is the first scenario that requires CDK synthesis at CI time (all others are raw CloudFormation/SAM templates). The workflow uses a separate `synth-localgov-drupal` job with the `deploy` job depending on it via `needs:`. This isolates CDK synth failures — a synth failure produces a clear red flag without the hub deploy even attempting to run.
- **Deployment time** — LocalGov Drupal takes 35-40 minutes to deploy (Aurora provisioning, Fargate startup, Drupal installation, AI content generation). ISB lease templates should set a 45-minute timeout for this blueprint, significantly longer than the 5 minutes used for SAM scenarios.
- **IAM role names** — The template creates IAM roles with explicit names matching the ISB SCP pattern (`InnovationSandbox-ndx-production-exec/task`). The `production` suffix is now hardcoded, which means only one deployment per sandbox account is possible (role name collision if deployed twice). This is fine — ISB provisions one blueprint per lease.
- **Future consideration** — If the project adds more CDK-based scenarios, the CI workflow pattern (synth + strip + write template.yaml) should be extracted into a reusable composite action rather than duplicating steps. Out of scope for this spec (YAGNI — only one CDK scenario exists).

## Review Notes
- Adversarial review completed
- Findings: 20 total, 4 new findings fixed, 16 pre-existing skipped
- Resolution approach: auto-fix
- F12 (CI tests): Added `npm run build` and `npm test` to synth-localgov-drupal CI job
- F14 (BLUEPRINT.md): Clarified CAPABILITY_AUTO_EXPAND note to reflect ISB hub applies it uniformly
- F19 (test assertions): Fixed 5 stale test assertions (health check path, WaitCondition removal, output descriptions)
- All 22 CDK tests passing
