---
title: 'ISB Blueprint Conversion — Remaining Scenarios + CI Pipeline'
slug: 'isb-remaining-scenarios-ci'
created: '2026-02-27'
status: 'review-complete'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack:
  - 'CloudFormation (SAM transform AWS::Serverless-2016-10-31)'
  - 'AWS Innovation Sandbox (ISB) blueprints via StackSets'
  - 'CloudFormation StackSets (self-managed)'
  - 'AWS CDK (TypeScript) for hub-account infrastructure'
  - 'GitHub Actions CI/CD'
  - 'AWS IAM OIDC federation'
  - 'Eleventy (11ty) static site with YAML data files'
files_to_modify:
  - 'cloudformation/scenarios/foi-redaction/template.yaml'
  - 'cloudformation/scenarios/planning-ai/template.yaml'
  - 'cloudformation/scenarios/quicksight-dashboard/template.yaml'
  - 'cloudformation/scenarios/smart-car-park/template.yaml'
  - 'cloudformation/scenarios/text-to-speech/template.yaml'
  - 'src/_data/scenarios.yaml'
  - '.github/workflows/deploy-blueprints.yml'
files_to_create:
  - 'cloudformation/isb-hub/bin/app.ts'
  - 'cloudformation/isb-hub/lib/isb-hub-stack.ts'
  - 'cloudformation/isb-hub/cdk.json'
  - 'cloudformation/isb-hub/package.json'
  - 'cloudformation/isb-hub/tsconfig.json'
  - 'cloudformation/isb-hub/package-lock.json'
  - 'cloudformation/scenarios/foi-redaction/BLUEPRINT.md'
  - 'cloudformation/scenarios/planning-ai/BLUEPRINT.md'
  - 'cloudformation/scenarios/quicksight-dashboard/BLUEPRINT.md'
  - 'cloudformation/scenarios/smart-car-park/BLUEPRINT.md'
  - 'cloudformation/scenarios/text-to-speech/BLUEPRINT.md'
code_patterns:
  - 'SAM transform with inline Python Lambda code'
  - 'Scenario data in src/_data/scenarios.yaml validated against schemas/scenario.schema.json'
  - 'CAPABILITY_IAM + CAPABILITY_NAMED_IAM + CAPABILITY_AUTO_EXPAND for all StackSets'
  - 'Most scenario templates follow similar structure: Lambda + FunctionURL + IAM Role + S3 + LogGroup (quicksight-dashboard is more complex with QuickSight-specific resources)'
  - 'ISB blueprint conversion pattern established in council-chatbot'
test_patterns:
  - 'No CloudFormation template unit tests exist'
  - 'Portal tests are Playwright screenshot/visual regression only'
  - 'Schema validation runs at build time via scenarios.yaml schema'
  - 'npm run build validates schema + Eleventy'
---

# Tech-Spec: ISB Blueprint Conversion — Remaining Scenarios + CI Pipeline

**Created:** 2026-02-27

## Overview

### Problem Statement

Only the council-chatbot scenario has been converted to ISB blueprint format. The other 5 SAM-based scenarios still have AutoCleanupHours parameters and S3 lifecycle rules that are redundant under ISB management. There is no CI pipeline to deploy templates to S3 or manage StackSets, no infrastructure-as-code for the hub-account resources (OIDC provider, IAM role, S3 bucket, StackSets), and no automated way to keep StackSets in sync with template changes.

### Solution

1. Convert 5 remaining SAM scenario templates using the same pattern established for council-chatbot (remove AutoCleanupHours, remove S3 lifecycle, fix data quality in scenarios.yaml, add capabilities).
2. Create a CDK (TypeScript) app that declaratively manages the OIDC identity provider, GitHub Actions IAM role, S3 blueprint template uploads, and all StackSet definitions — a single `cdk deploy` handles everything atomically.
3. Create a GitHub Actions workflow that authenticates via OIDC, runs `cdk deploy`, which uploads templates to S3 and creates/updates all StackSets in dependency order.

### Scope

**In Scope:**

- Convert 5 templates: foi-redaction, planning-ai, quicksight-dashboard, smart-car-park, text-to-speech
- Update `scenarios.yaml` for each scenario (remove AutoCleanupHours param, add CAPABILITY_NAMED_IAM + CAPABILITY_AUTO_EXPAND, remove incorrect service references)
- Create BLUEPRINT.md for each scenario
- CDK app (`cloudformation/isb-hub/`) managing:
  - `BucketDeployment` to sync all 6 scenario templates to S3 (deterministic paths: `scenarios/{name}/template.yaml`)
  - GitHub OIDC identity provider (`OpenIdConnectProvider`)
  - GitHub Actions IAM role with OIDC trust policy (locked to `main` branch)
  - 6 `CfnStackSet` resources (one per scenario, including council-chatbot)
  - Reference existing S3 bucket via `Bucket.fromBucketName`
- GitHub Actions workflow (`.github/workflows/deploy-blueprints.yml`)
- Fix QuickSight hardcoded SSO username for ISB portability
- Import existing council-chatbot StackSet into CDK on first deploy

**Out of Scope:**

- LocalGov Drupal conversion (CDK-based, ~30-40 resources, parked for separate spec)
- ISB web UI blueprint registration (manual step)
- Changes to Lambda function code in any template
- ISB hub account setup or ISB installation itself
- Portal UI changes

## Context for Development

### Codebase Patterns

- Council-chatbot conversion already completed — established the pattern
- All 5 remaining templates use SAM transform with inline Python, same resource structure
- `scenarios.yaml` validated against `schemas/scenario.schema.json` at build time
- Existing CI is in `.github/workflows/build-deploy.yml` (Eleventy + GitHub Pages) — `id-token: write` already in permissions
- GitHub repo: `co-cddo/ndx_try_aws_scenarios`
- Hub account: `568672915267`, ISB namespace: `ndx`, ISB region: `us-west-2`
- Blueprints S3 bucket: `ndx-try-isb-blueprints-568672915267` in `us-east-1`
- Existing CDK app pattern: `cloudformation/scenarios/localgov-drupal/cdk/` — CDK `^2.238.0`, TypeScript `~5.9.3`, modular constructs, `ts-node` execution
- Existing CI uses Node 20, npm caching via `actions/setup-node`, concurrency control, separate jobs with dependencies

### Per-Template Investigation Findings

#### foi-redaction
- AutoCleanupHours: param L39-44, Metadata L18-20, lifecycle L61-65 (hardcoded 1 day), ScenarioInfo L820-828
- IAM: Comprehend uses `Resource: '*'` — OK for ISB (no region-specific ARN needed)
- **Data quality:** `scenarios.yaml` lists "Amazon Textract" in awsServices but template doesn't use Textract

#### planning-ai
- AutoCleanupHours: param L31-36, Metadata L11-19, lifecycle L53-57 (hardcoded 1 day), ScenarioInfo L1269-1278
- IAM: Textract uses `Resource: '*'` — OK for ISB
- **Data quality:** `scenarios.yaml` lists "Amazon Comprehend" in awsServices but template doesn't use Comprehend. Same issue in `deploymentPhases`.
- **Phantom parameter:** `SampleDataBucket` in `scenarios.yaml` (L420-422) doesn't exist in template — bucket is created inline as `PlanningDocsBucket`

#### quicksight-dashboard
- AutoCleanupHours: param L37-42, Metadata L11-20, lifecycle L66-71 (hardcoded 7 days), ScenarioInfo L913-925 — **does NOT reference AutoCleanupHours** (moot since we're removing it)
- Already has `CAPABILITY_NAMED_IAM` in scenarios.yaml
- **ISB issue:** `QuickSightUsername` parameter (L44-47) has hardcoded SSO user default — needs fixing for ISB portability
- **Data quality:** `scenarios.yaml` lists "AWS Glue" in awsServices but template doesn't use Glue

#### smart-car-park
- AutoCleanupHours: param L39-44, Metadata L11-20, lifecycle L81-85 (hardcoded 1 day), ScenarioInfo L698-708
- Already has `CAPABILITY_AUTO_EXPAND` in scenarios.yaml
- **Data quality:** `scenarios.yaml` lists "AWS IoT Core", "Amazon Timestream", "Amazon QuickSight", and "Amazon API Gateway" in awsServices but template actually uses DynamoDB + Lambda. Same incorrect services appear in `skillsLearned` and `deploymentPhases`.
- **Phantom parameter:** `DataGenerationInterval` in `scenarios.yaml` (L696-698) doesn't exist in template

#### text-to-speech
- AutoCleanupHours: param L52-57, Metadata L11-21, lifecycle L74-78 (hardcoded 1 day), ScenarioInfo L646-655
- IAM: Polly uses `Resource: '*'` — OK for ISB
- **Data quality:** Clean — no issues

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/council-chatbot/template.yaml` | Reference — already converted |
| `cloudformation/scenarios/council-chatbot/BLUEPRINT.md` | Reference — blueprint registration guide pattern |
| `cloudformation/scenarios/foi-redaction/template.yaml` | Conversion target — AutoCleanup L39-44, lifecycle L61-65 |
| `cloudformation/scenarios/planning-ai/template.yaml` | Conversion target — AutoCleanup L31-36, lifecycle L53-57 |
| `cloudformation/scenarios/quicksight-dashboard/template.yaml` | Conversion target — AutoCleanup L37-42, lifecycle L66-71, QuickSightUsername L44-47 |
| `cloudformation/scenarios/smart-car-park/template.yaml` | Conversion target — AutoCleanup L39-44, lifecycle L81-85 |
| `cloudformation/scenarios/text-to-speech/template.yaml` | Conversion target — AutoCleanup L52-57, lifecycle L74-78 |
| `src/_data/scenarios.yaml` | Portal scenario config — per-scenario updates needed |
| `schemas/scenario.schema.json` | Schema — already supports CAPABILITY_AUTO_EXPAND and CAPABILITY_NAMED_IAM |
| `.github/workflows/build-deploy.yml` | Existing CI — Node 20, npm cache, id-token: write, concurrency control |
| `cloudformation/scenarios/localgov-drupal/cdk/` | Reference CDK app — version, structure, tsconfig patterns |
| `_bmad-output/implementation-artifacts/tech-spec-isb-blueprint-conversion.md` | Completed council-chatbot spec |

### Technical Decisions

1. **Hub-account IaC uses CDK (TypeScript)** — CDK asset system handles template upload + StackSet definition atomically in one `cdk deploy`, eliminating two-phase CI complexity. Repo already uses CDK for localgov-drupal.
2. **CDK `CfnStackSet` L1 constructs** — declarative StackSet management with `TemplateURL` pointing to CDK-uploaded assets
3. **CDK `BucketDeployment`** — syncs scenario templates to S3 as CDK assets, StackSets reference the asset URLs
4. **OIDC federation** — no long-lived AWS credentials stored in GitHub Secrets. Trust policy locked to `repo:co-cddo/ndx_try_aws_scenarios:ref:refs/heads/main` only.
5. **Single `cdk deploy` in CI** — handles asset uploads, OIDC provider, IAM role, S3 bucket, and all StackSet definitions in dependency order
6. **ISB hub stack deployed in `us-west-2`** — where ISB lives and looks for StackSets
7. **S3 bucket in `us-east-1`** — import existing `ndx-try-isb-blueprints-568672915267` via `Bucket.fromBucketName`, cross-region S3 URLs work for StackSet `TemplateURL`
8. **Empty StackSets** — no stack instances defined; ISB populates instances when leases are approved. Updating the hub stack does NOT trigger re-deploys to existing sandbox accounts.
9. **All StackSets get identical capabilities** — `CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND` (every template uses named IAM roles + SAM transform)
10. **CDK bootstrap is the one-time manual prerequisite** — `cdk bootstrap aws://568672915267/us-west-2` in the hub account before first CI run
11. **Deterministic S3 paths** — `BucketDeployment` per scenario with `destinationKeyPrefix: 'scenarios/{name}'`, giving stable TemplateURLs: `https://ndx-try-isb-blueprints-568672915267.s3.us-east-1.amazonaws.com/scenarios/{name}/template.yaml`
12. **Flat CDK app** — one stack file, no modular constructs. All resources in `lib/isb-hub-stack.ts`. Matches pragmatic scope.
13. **First deploy is manual** — run from dev machine via SSO (`NDX/InnovationSandboxHub` profile). Creates the OIDC provider + IAM role. After that, CI self-manages via OIDC.
14. **Import existing council-chatbot StackSet** — `ndx-try-council-chatbot` was created manually. Check for active instances first. If none, delete and let CDK recreate. If active instances exist, use `cdk import` to bring it under CDK management.
15. **Fixed IAM role name** — GitHub Actions role uses `roleName: 'isb-hub-github-actions-deploy'` so the ARN is known at code-time and can be hardcoded in the workflow file. Avoids chicken-and-egg sequencing between CDK deploy and workflow commit.
16. **OIDC provider lookup-or-create** — check if GitHub OIDC provider exists before deploying. Use `fromOpenIdConnectProviderArn` if it does, `new OpenIdConnectProvider` if it doesn't.

## Implementation Plan

### Tasks

#### Track A: Template Conversions

- [x] Task 1: Convert foi-redaction template
  - File: `cloudformation/scenarios/foi-redaction/template.yaml`
  - Action: Remove `AutoCleanupHours` parameter definition (L39-44)
  - Action: Remove `AutoCleanupHours` from `Metadata.AWS::CloudFormation::Interface.ParameterGroups` Auto-Cleanup group (L18-20). If group becomes empty, remove entire group.
  - Action: Remove `LifecycleConfiguration` block from the S3 bucket (L61-65)
  - Action: Remove `"autoCleanup"` line from `ScenarioInfo` output Value (around L820-828)
  - Notes: IAM policies use `Resource: '*'` for Comprehend — no region fix needed.

- [x] Task 2: Convert planning-ai template
  - File: `cloudformation/scenarios/planning-ai/template.yaml`
  - Action: Remove `AutoCleanupHours` parameter definition (L31-36)
  - Action: Remove `AutoCleanupHours` from Metadata ParameterGroups Auto-Cleanup group (L11-19). If group becomes empty, remove entire group.
  - Action: Remove `LifecycleConfiguration` block from the S3 bucket (L53-57)
  - Action: Remove `"autoCleanup"` line from `ScenarioInfo` output Value (around L1269-1278)
  - Notes: IAM policies use `Resource: '*'` for Textract — no region fix needed.

- [x] Task 3: Convert quicksight-dashboard template
  - File: `cloudformation/scenarios/quicksight-dashboard/template.yaml`
  - Action: Remove `AutoCleanupHours` parameter definition (L37-42)
  - Action: Remove `AutoCleanupHours` from Metadata ParameterGroups Auto-Cleanup group (L11-20). If group becomes empty, remove entire group.
  - Action: Remove `LifecycleConfiguration` block from the S3 bucket (L66-71)
  - Action: Fix `QuickSightUsername` parameter (L44-47) — remove the hardcoded SSO user default (`chris.nesbitt-smith@digital.cabinet-office.gov.uk` or similar). Replace with an empty default or `NoValue` and add a `Description` explaining the user must provide their QuickSight username. Update the parameter in `Metadata.ParameterGroups` and `ParameterLabels` if needed.
  - Notes: `ScenarioInfo` output (L913-925) does NOT reference `AutoCleanupHours` — no change needed there.

- [x] Task 4: Convert smart-car-park template
  - File: `cloudformation/scenarios/smart-car-park/template.yaml`
  - Action: Remove `AutoCleanupHours` parameter definition (L39-44)
  - Action: Remove `AutoCleanupHours` from Metadata ParameterGroups Auto-Cleanup group (L11-20). If group becomes empty, remove entire group.
  - Action: Remove `LifecycleConfiguration` block from the S3 bucket (L81-85)
  - Action: Remove `"autoCleanup"` line from `ScenarioInfo` output Value (around L698-708)

- [x] Task 5: Convert text-to-speech template
  - File: `cloudformation/scenarios/text-to-speech/template.yaml`
  - Action: Remove `AutoCleanupHours` parameter definition (L52-57)
  - Action: Remove `AutoCleanupHours` from Metadata ParameterGroups Auto-Cleanup group (L11-21). If group becomes empty, remove entire group.
  - Action: Remove `LifecycleConfiguration` block from the S3 bucket (L74-78)
  - Action: Remove `"autoCleanup"` line from `ScenarioInfo` output Value (around L646-655)
  - Notes: IAM policies use `Resource: '*'` for Polly — no region fix needed. Data quality is clean.

#### Track B: scenarios.yaml + BLUEPRINT.md

- [x] Task 6: Update scenarios.yaml for all 5 scenarios
  - File: `src/_data/scenarios.yaml`
  - Action: For each of the 5 scenarios, remove the `AutoCleanupHours` parameter entry from `deployment.parameters`
  - Action: Remove phantom parameters that don't exist in the actual templates:
    - planning-ai: remove `SampleDataBucket` parameter (L420-422) — template has no such parameter, bucket is created inline as `PlanningDocsBucket`
    - smart-car-park: remove `DataGenerationInterval` parameter (L696-698) — template has no such parameter
  - Action: Ensure all 5 scenarios have all three capabilities: `CAPABILITY_IAM`, `CAPABILITY_NAMED_IAM`, `CAPABILITY_AUTO_EXPAND`. Add any that are missing:
    - foi-redaction: add `CAPABILITY_NAMED_IAM` + `CAPABILITY_AUTO_EXPAND` (currently has neither)
    - planning-ai: add `CAPABILITY_NAMED_IAM` + `CAPABILITY_AUTO_EXPAND` (currently has neither)
    - quicksight-dashboard: add `CAPABILITY_AUTO_EXPAND` (already has `CAPABILITY_NAMED_IAM`)
    - smart-car-park: add `CAPABILITY_NAMED_IAM` (already has `CAPABILITY_AUTO_EXPAND`)
    - text-to-speech: add `CAPABILITY_NAMED_IAM` + `CAPABILITY_AUTO_EXPAND` (currently has neither)
  - Action: Fix data quality in `awsServices`:
    - foi-redaction: remove `"Amazon Textract"` (template doesn't use Textract)
    - planning-ai: remove `"Amazon Comprehend"` (template doesn't use Comprehend)
    - quicksight-dashboard: remove `"AWS Glue"` (template doesn't use Glue)
    - smart-car-park: remove `"AWS IoT Core"`, `"Amazon Timestream"`, `"Amazon QuickSight"`, and `"Amazon API Gateway"` (template uses DynamoDB + Lambda, not these services). Add `"Amazon DynamoDB"` if not already present.
  - Action: Fix data quality in `skillsLearned` — remove references to the same incorrect services removed from `awsServices`:
    - planning-ai: remove any Comprehend references from skillsLearned
    - quicksight-dashboard: remove any Glue/ETL references from skillsLearned
    - smart-car-park: remove IoT Core, Timestream, QuickSight, API Gateway references from skillsLearned. Add DynamoDB if appropriate.
  - Action: Fix data quality in `deploymentPhases` — remove references to the same incorrect services:
    - foi-redaction: remove any Textract deployment phases
    - planning-ai: remove any Comprehend deployment phases
    - quicksight-dashboard: remove any Glue deployment phases
    - smart-car-park: remove IoT Core, Timestream, QuickSight, API Gateway deployment phases. Add DynamoDB/Lambda phases if appropriate.
  - Notes: text-to-speech has no data quality issues. Run `npm run build` after changes to validate schema. When removing deployment phases, verify remaining phases are plausible for the template's actual resources. Audit any remaining `deployment.parameters` entries against the actual template parameters to ensure no other phantom parameters exist.

- [x] Task 7: Create BLUEPRINT.md for each scenario
  - Files: `cloudformation/scenarios/{foi-redaction,planning-ai,quicksight-dashboard,smart-car-park,text-to-speech}/BLUEPRINT.md`
  - Action: Create each file following the `council-chatbot/BLUEPRINT.md` pattern
  - Action: Customise per scenario:
    - StackSet name: `ndx-try-{scenario-name}`
    - Description: scenario-specific (match `scenarios.yaml` title)
    - Verification steps: scenario-specific resources to check (Lambda function name pattern, S3 bucket, IAM role)
    - Capabilities: `CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND` for all
    - Region note: StackSet must be created in ISB deployment region (`us-west-2`)
  - Notes: These are documentation/reference files. CI deployment via CDK supersedes the manual steps, but BLUEPRINT.md remains useful for understanding the registration process.

#### Track C: CDK Hub App + CI Pipeline

- [x] Task 8: Create CDK hub app scaffolding
  - Files to create:
    - `cloudformation/isb-hub/package.json`
    - `cloudformation/isb-hub/tsconfig.json`
    - `cloudformation/isb-hub/cdk.json`
    - `cloudformation/isb-hub/bin/app.ts`
  - Action: Create `package.json` with dependencies matching localgov-drupal pattern: `aws-cdk-lib` `^2.238.0`, `constructs` `^10.0.0`, `aws-cdk` `^2.1106.0` (devDep), `typescript` `~5.9.3` (devDep), `ts-node` (devDep), `@types/node` (devDep). Add `s3-deployment` — it's in `aws-cdk-lib` already so no extra dependency.
  - Action: Create `tsconfig.json` matching localgov-drupal: target `ES2020`, module `CommonJS`, strict mode, outDir `./dist` (NOT `./cdk.out` — that's reserved for CDK synth output)
  - Action: Create `cdk.json` with `"app": "npx ts-node --prefer-ts-exts bin/app.ts"`
  - Action: Create `bin/app.ts` — instantiate `IsbHubStack` with `env: { account: '568672915267', region: 'us-west-2' }`
  - Notes: Run `npm install` in `cloudformation/isb-hub/` after creating scaffolding. Commit the generated `package-lock.json` — CI uses `npm ci` which requires it. Add `cloudformation/isb-hub/node_modules/`, `cloudformation/isb-hub/cdk.out/`, and `cloudformation/isb-hub/dist/` to `.gitignore` if not already covered.

- [x] Task 9: Implement ISB hub CDK stack
  - File: `cloudformation/isb-hub/lib/isb-hub-stack.ts`
  - Action: Import existing S3 bucket:
    ```typescript
    const bucket = s3.Bucket.fromBucketName(this, 'BlueprintsBucket', 'ndx-try-isb-blueprints-568672915267');
    ```
  - Action: Create one `BucketDeployment` per scenario (6 total, including council-chatbot). Each uploads `template.yaml` from `../scenarios/{name}/` to `scenarios/{name}/` prefix in the bucket:
    ```typescript
    const councilChatbotDeploy = new s3deploy.BucketDeployment(this, 'CouncilChatbotTemplates', {
      sources: [s3deploy.Source.asset('../scenarios/council-chatbot', { exclude: ['*', '!template.yaml'] })],
      destinationBucket: bucket,
      destinationKeyPrefix: 'scenarios/council-chatbot',
    });
    ```
  - Action: For the imported bucket, explicitly grant `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` to the BucketDeployment's handler role. CDK cannot auto-grant permissions on imported buckets. Use `bucket.grantReadWrite(deployment.handlerRole)` or add an explicit IAM policy statement.
  - Action: Create or look up GitHub OIDC identity provider. Only one can exist per account — if one already exists (e.g. from existing CI), CDK will fail on create. Use a context lookup or try/catch:
    ```typescript
    // Option A: Look up existing provider by ARN
    const oidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this, 'GitHubOidc',
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
    );
    // Option B: Create new (only if no provider exists in the account)
    // const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
    //   url: 'https://token.actions.githubusercontent.com',
    //   clientIds: ['sts.amazonaws.com'],
    // });
    ```
    Determine which option at implementation time by checking whether the provider already exists in the hub account. If it does NOT exist, use Option B. If it does, use Option A.
  - Action: Create GitHub Actions IAM role with OIDC trust:
    ```typescript
    const deployRole = new iam.Role(this, 'GitHubActionsRole', {
      roleName: 'isb-hub-github-actions-deploy',
      assumedBy: new iam.OpenIdConnectPrincipal(oidcProvider, {
        StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
        StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:co-cddo/ndx_try_aws_scenarios:ref:refs/heads/main' },
      }),
    });
    ```
    Use a fixed `roleName` so the ARN is known at code-time and can be hardcoded in the GitHub Actions workflow (avoids chicken-and-egg: workflow needs role ARN, but role is created by the stack). Grant the role permission to assume CDK bootstrap roles (`cdk-*-568672915267-us-west-2`) for `cdk deploy`. Also grant `s3:*` on the blueprints bucket and `cloudformation:*StackSet*` permissions.
  - Action: Create 6 `CfnStackSet` resources (one per scenario). Each:
    ```typescript
    const councilChatbotStackSet = new cfn.CfnStackSet(this, 'CouncilChatbotStackSet', {
      stackSetName: 'ndx-try-council-chatbot',
      permissionModel: 'SELF_MANAGED',
      administrationRoleArn: `arn:aws:iam::568672915267:role/InnovationSandbox-ndx-IntermediateRole`,
      executionRoleName: 'InnovationSandbox-ndx-SandboxAccountRole',
      capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
      managedExecution: { Active: true },
      templateUrl: `https://ndx-try-isb-blueprints-568672915267.s3.us-east-1.amazonaws.com/scenarios/council-chatbot/template.yaml`,
      description: 'NDX:Try Council Chatbot - AI-powered resident Q&A assistant',
    });
    councilChatbotStackSet.node.addDependency(councilChatbotDeploy);
    ```
  - Action: Add explicit `node.addDependency()` from each StackSet to its corresponding BucketDeployment — CDK can't infer this dependency since TemplateURL is a literal string, not a CDK token.
  - Notes: StackSets have NO `stackInstances` — ISB manages instances when leases are approved. The OIDC role ARN should be output as a stack output for use in the GitHub Actions workflow. Consider using a `CfnOutput` for the role ARN.

- [x] Task 10: Create GitHub Actions deploy-blueprints workflow
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Create workflow with:
    ```yaml
    name: Deploy ISB Blueprints
    on:
      push:
        branches: [main]
        paths:
          - 'cloudformation/scenarios/*/template.yaml'
          - 'cloudformation/isb-hub/**'
      workflow_dispatch:
    permissions:
      id-token: write
      contents: read
    concurrency:
      group: deploy-blueprints
      cancel-in-progress: false
    jobs:
      deploy:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v6
          - uses: actions/setup-node@v6
            with:
              node-version: '20'
              cache: 'npm'
              cache-dependency-path: cloudformation/isb-hub/package-lock.json
          - uses: aws-actions/configure-aws-credentials@v4
            with:
              role-to-assume: arn:aws:iam::568672915267:role/isb-hub-github-actions-deploy
              aws-region: us-west-2
          - run: npm ci
            working-directory: cloudformation/isb-hub
          - run: npx cdk deploy --require-approval never
            working-directory: cloudformation/isb-hub
    ```
  - Notes: The role ARN uses the fixed `roleName: 'isb-hub-github-actions-deploy'` from Task 9, avoiding a chicken-and-egg problem (workflow can be committed before the first deploy). `cancel-in-progress: false` prevents concurrent deploys from interrupting each other. Action versions match existing `build-deploy.yml` (checkout@v6, setup-node@v6). The first push to main will fail until the manual first deploy (which creates the OIDC provider + role) completes — this is expected and documented in the first-deploy procedure.

### Acceptance Criteria

- [x] AC 1: Given each of the 5 converted templates, when deployed via CloudFormation standalone in its target region, then the stack creates successfully with all resources (Lambda, S3, IAM Role, Function URL, Log Group).
- [x] AC 2: Given each converted template, when the `AutoCleanupHours` parameter is passed, then the deployment fails with an "unknown parameter" error (parameter removed).
- [x] AC 3: Given the updated `scenarios.yaml`, when `npm run build` runs, then schema validation passes with no errors.
- [x] AC 4: Given the updated `scenarios.yaml`, when inspected, then no scenario lists incorrect entries in `awsServices`, `skillsLearned`, or `deploymentPhases` (no Textract in foi-redaction, no Comprehend in planning-ai, no Glue in quicksight-dashboard, no IoT Core/Timestream/QuickSight/API Gateway in smart-car-park), and no phantom parameters exist in `deployment.parameters` (no SampleDataBucket in planning-ai, no DataGenerationInterval in smart-car-park).
- [x] AC 5: Given the quicksight-dashboard template, when the `QuickSightUsername` parameter is inspected, then it no longer contains a hardcoded SSO user email as default.
- [x] AC 6: Given the CDK hub app, when `npx cdk synth` runs from `cloudformation/isb-hub/`, then it produces a valid CloudFormation template containing 6 StackSet resources, BucketDeployment resources, an OIDC provider, and an IAM role.
- [x] AC 7: Given the CDK hub stack deployed to `us-west-2`, when ISB admin lists available StackSets, then all 6 scenario StackSets appear with ACTIVE status and SELF_MANAGED permission model.
- [x] AC 8: Given the `deploy-blueprints` workflow, when triggered on push to `main` with template changes, then it authenticates via OIDC, runs `cdk deploy`, and updates StackSet TemplateURLs with the new template content.
- [x] AC 9: Given a BLUEPRINT.md file for any scenario, when an operator reads it, then they understand the registration process without needing additional context.

## Additional Context

### Dependencies

- Council-chatbot conversion already completed (prerequisite satisfied)
- AWS Innovation Sandbox deployed in hub account `568672915267` (pre-existing)
- ISB IntermediateRole and SandboxAccountRole exist (created by ISB deployment)
- S3 bucket `ndx-try-isb-blueprints-568672915267` exists in `us-east-1` (created manually during council-chatbot work)
- Existing council-chatbot StackSet `ndx-try-council-chatbot` in `us-west-2` (needs import or recreation)
- CDK bootstrap required: `cdk bootstrap aws://568672915267/us-west-2` (one-time manual step)
- GitHub OIDC provider may already exist in the account — first-deploy procedure includes a check; stack uses lookup-or-create pattern

### First-Deploy Procedure

1. `cdk bootstrap aws://568672915267/us-west-2` (if not already bootstrapped)
2. `cd cloudformation/isb-hub && npm install`
3. Check for existing OIDC provider: `aws iam list-open-id-connect-providers --profile NDX/InnovationSandboxHub`. If `token.actions.githubusercontent.com` exists, use `fromOpenIdConnectProviderArn` in the stack (Option A). If not, use `new OpenIdConnectProvider` (Option B).
4. Check for active StackSet instances: `aws cloudformation list-stack-instances --stack-set-name ndx-try-council-chatbot --region us-west-2 --profile NDX/InnovationSandboxHub`. If instances exist, use `cdk import` to bring the StackSet under CDK management. If no instances, delete the StackSet and let CDK recreate it.
5. `npx cdk deploy --profile NDX/InnovationSandboxHub` (creates OIDC provider + IAM role `isb-hub-github-actions-deploy` + StackSets + uploads templates)
6. The workflow file already contains the hardcoded role ARN (`isb-hub-github-actions-deploy`), so no manual ARN update needed. Subsequent pushes to `main` trigger CI automatically.

### Testing Strategy

- **Schema validation**: `npm run build` validates `scenarios.yaml` against schema — catches data quality regressions
- **CDK synth**: `npx cdk synth` in `cloudformation/isb-hub/` verifies the CDK app produces valid CloudFormation — can run in CI or locally
- **Manual CloudFormation deploy**: Deploy each converted template as a standalone stack to verify it still works
- **ISB end-to-end**: After CDK deploy, request test leases for each scenario via ISB, verify blueprints deploy to sandbox accounts
- No additional automated tests to add (no existing CFN test infrastructure)

### Notes

- **Risk: BucketDeployment cross-region** — CDK stack is in `us-west-2`, S3 bucket is in `us-east-1`. The BucketDeployment Lambda runs in `us-west-2` and writes cross-region to `us-east-1`. This should work (S3 API is global) but verify on first deploy. **Fallback**: if cross-region BucketDeployment fails, replace with an AWS CLI `aws s3 sync` step in the GitHub Actions workflow before `cdk deploy`, and remove BucketDeployment from the stack. StackSet TemplateURLs remain the same either way.
- **Risk: Bedrock/QuickSight model availability** — ISB sandbox accounts may not have Bedrock models or QuickSight enabled by default. This is an ISB account provisioning concern, not a template concern.
- **Risk: CI self-management circular dependency** — the CDK stack manages the OIDC provider + IAM role that CI uses to deploy. If a CDK change accidentally bricks the IAM role, CI cannot self-recover. **Break-glass procedure**: an admin with SSO access (`NDX/InnovationSandboxHub` profile) runs `npx cdk deploy --profile NDX/InnovationSandboxHub` from a local machine to fix the role, restoring CI access.
- **Risk: S3 race condition** — BucketDeployment uploads templates to deterministic (non-versioned) S3 paths. During the brief window between S3 upload completing and the StackSet `TemplateURL` update, ISB could theoretically read a stale or in-flight template. Accepted risk — the window is seconds, ISB lease approvals are not that frequent, and the TemplateURL points to the same path before and after the update.
- **LocalGov Drupal** — parked for separate spec. ~30-40 CDK-generated resources, significantly more complex than SAM templates.
- **OIDC provider uniqueness** — only one GitHub OIDC provider can exist per AWS account. Task 9 addresses this with a lookup-or-create pattern. First-deploy procedure includes a check.
- **StackSet update behaviour** — updating a StackSet definition (e.g. new TemplateURL) does NOT automatically update existing stack instances. ISB handles instance lifecycle separately.

## Review Notes

- Adversarial review completed
- Findings: 18 total (4 High, 7 Medium, 7 Low), 15 real, 2 noise, 1 undecided
- All 16 real/undecided findings addressed:
  - F1 (High): Extended Task 6 to fix `skillsLearned` and `deploymentPhases` data quality, not just `awsServices`
  - F2 (High): Task 9 updated with OIDC provider lookup-or-create pattern; first-deploy procedure includes check
  - F3 (High): Task 8 tsconfig `outDir` corrected from `./cdk.out` to `./dist`
  - F4 (High): Fixed role name hardcoded as `isb-hub-github-actions-deploy` in both CDK stack and workflow; eliminates placeholder
  - F5 (Medium): Task 6 extended to remove phantom `SampleDataBucket` param from planning-ai
  - F6 (Medium): Task 6 extended to remove phantom `DataGenerationInterval` param from smart-car-park
  - F7 (Medium): Added fallback plan (aws s3 sync) if cross-region BucketDeployment fails
  - F8 (Medium): Task 9 extended with explicit permission granting for imported bucket
  - F9 (Medium): Task 6 extended to remove QuickSight + API Gateway from smart-car-park
  - F10 (Medium): First-deploy procedure updated with StackSet instance check before import/delete
  - F11 (Medium): Added break-glass procedure for CI self-management failure
  - F12 (Low): Updated action versions from @v4 to @v6 to match existing CI
  - F13 (Low): Added `package-lock.json` to files_to_create; noted it must be committed
  - F14 (Low): Added audit note in Task 6 to check remaining params against templates
  - F15 (Low): Fixed code_patterns to note quicksight-dashboard has different structure
  - F16 (Low/undecided): Accepted race condition risk with documented rationale
