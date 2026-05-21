---
title: 'Scenario Regression Smoke-Test Pack & Long-Lived Test Account'
slug: 'scenario-regression-smoke-pack'
created: '2026-05-11'
status: 'superseded'
supersededOn: '2026-05-21'
supersededBy: 'Per-scenario ephemeral-lease CI — plan at .claude/plans/rosy-sparking-narwhal.md'
supersededReason: 'The all-demo umbrella + long-lived smoke account model documented here was demolished. See the replacement plan for the per-scenario ISB-lease CI design.'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'CloudFormation nested stacks (via all-demo); template-bucket: ndx-try-isb-blueprints-568672915267 in us-east-1; path convention scenarios/{name}/template.yaml'
  - 'AWS CDK 2.251+ (TypeScript ~5.9.3), aws-cdk-lib + constructs 10.5+; existing isb-hub uses ts-node entry; Node >= 22'
  - 'AWS Organizations: 5 SCPs created by ISB CDK (AwsNukeSupportedServices, Restrictions, ProtectISB, LimitRegions on sandboxOu parent; WriteProtection on Available/CleanUp/Quarantine/Entry/Exit). Active OU inherits 4 parent SCPs only.'
  - 'GitHub Actions OIDC via aws-actions/configure-aws-credentials@v6; existing role isb-hub-github-actions-deploy locked to refs/heads/main; sts.amazonaws.com default audience.'
  - 'Playwright @playwright/test ^1.59.1; tests/ dir; desktop+mobile projects; BASE_URL env var; no auth/storageState yet.'
  - 'Self-hosted Renovate via renovatebot/github-action (replacing dependabot.yml)'
  - 'GHCR (own images: 9x :latest) + docker.io (apache/tika upstream) + ghcr.io (paperless-ngx upstream)'
files_to_modify:
  - 'cloudformation/scenarios/all-demo/template.yaml'
  - '.github/dependabot.yml (delete in phase 6)'
  - '.github/workflows/deploy-blueprints.yml (add synth jobs for missing scenarios)'
  - 'cloudformation/scenarios/fixmystreet/cdk/lib/constructs/compute.ts (1 :latest)'
  - 'cloudformation/scenarios/planx/cdk/lib/constructs/compute.ts (4 :latest)'
  - 'cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts (1 :latest)'
  - 'cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts (2 :latest)'
  - 'cloudformation/scenarios/minute/template.yaml (3 :latest)'
  - 'playwright.config.ts (add smoke project)'
  - 'package.json (add test:smoke script)'
files_to_create:
  - 'docs/smoke-test-account-setup.md (runbook for one-off manual setup — replaces a CDK app)'
  - 'docs/smoke-test-account-config.yml (captures account ID + deploy role ARN as committed constants for workflows to consume)'
  - '.github/CODEOWNERS (security/devops review on smoke-pack sensitive paths)'
  - '.github/workflows/quarterly-audit.yml (auto-opens audit issue every 3 months)'
  - 'tests/smoke/fixtures/secure-form.ts (helper that wraps page.fill and scrubs trace request bodies)'
  - '.github/workflows/smoke.yml'
  - '.github/workflows/renovate.yml'
  - 'renovate.json'
  - 'scripts/smoke.sh'
  - '.env.example'
  - 'scripts/lint-retention-policies.sh'
  - 'tests/smoke/<scenario>.spec.ts (one per scenario; 17 files)'
  - 'tests/smoke/fixtures/cfn-outputs.ts (helper that reads describe-stacks)'
  - 'tests/smoke/fixtures/assertion-bar.ts (table of per-scenario bars)'
code_patterns:
  - 'Roles named with InnovationSandbox-ndx-* prefix (SCP-enforced)'
  - 'OIDC trust pattern: StringEquals aud=sts.amazonaws.com + StringLike sub=repo:co-cddo/ndx_try_aws_scenarios:* + StringEquals repository_owner=co-cddo (rejects forks)'
  - 'Workflow concurrency groups with cancel-in-progress:false'
  - 'Template validation in CI: <400KB, no AssetParameters, DeletionPolicy checks (existing pattern to extend for retention-policy lint)'
  - 'Container :latest pattern: ecs.ContainerImage.fromRegistry(string-literal) — surgery target is the literal'
  - 'Smoke-test account setup: runbook-only (no CDK), per ADR-3 revised'
test_patterns:
  - 'playwright.config.ts at repo root; testDir=./tests; projects: Desktop Chrome 1280x800 + iPhone SE 375x667'
  - 'baseURL=process.env.BASE_URL || http://localhost:8080; webServer auto-starts http-server _site:8080'
  - 'fullyParallel except CI (workers=1); maxDiffPixelRatio=0.1 for screenshot diff'
  - 'No auth setup, no storageState — smoke pack must own its login flow'
  - 'npm run test:playwright / test:screenshots / test:visual scripts exist; we add test:smoke'
---

# Tech-Spec: Scenario Regression Smoke-Test Pack & Long-Lived Test Account

**Created:** 2026-05-11

## Overview

### Problem Statement

Regressions are reaching live NDX:Try scenarios because there is no automated end-to-end test that exercises each scenario as a user would after deploy. The existing CI only validates that templates upload to S3 and that StackSets sync; it does not assert that any scenario actually works once deployed into a sandbox account. Compounding this, a number of scenarios reference container images by floating tags (`:latest` on minute x3, fixmystreet, planx x4, localgov-drupal, paperless-ngx, upstream tika) — so an upstream publish or even a passing build of our own image can silently change behaviour in production with no signal until users hit the break.

We do not currently have an AWS account suitable for a long-lived test harness: ISB pool accounts are intentionally short-lived and lifecycle-managed, and a vanilla outside-the-org account would not be bound by the same SCPs the scenarios run under in production — so smoke tests on it would not faithfully reproduce SCP-driven failures we have repeatedly hit (e.g. role-prefix denials, Secrets Manager blocks).

### Solution

1. **Expand `all-demo`** from 7 nested scenarios to all 17, so a single `all-demo` deploy is the canonical "everything works" deploy.
2. **Provision a long-lived smoke-test AWS account via a one-off manual runbook**, not IaC. The runbook (`docs/smoke-test-account-setup.md`, committed in this repo) walks an operator through: `aws organizations create-account`, OU placement, SCP-inheritance verification, OIDC provider + deploy role creation. Account is placed as a child of `sandboxOu` (peer to ISB's `Active` OU) so the 4 parent SCPs (`AwsNukeSupportedServices`, `Restrictions`, `ProtectISB`, `LimitRegions`) inherit. `WriteProtection` is not inherited (it does not apply to Active, and we need write access). The account is invisible to ISB's lifecycle Lambdas, which iterate a hardcoded `IsbOuSchema` enum that does not include our new OU. **Rationale for runbook-not-IaC** (ADR-3): the org-management state is set-once and rare to change; the operational simplicity of running a 10-step CLI procedure once exceeds the blast-radius cost of automating it via a CDK app that could go wrong on every deploy.
3. **Set up GitHub Actions OIDC trust** into the new account as part of the same runbook (one-off `aws iam create-open-id-connect-provider` + `aws iam create-role` calls). Account ID + deploy role ARN are committed to `docs/smoke-test-account-config.yml` for the smoke workflow to consume. Updates to the role's policy (rare) are documented in the runbook as a single `aws iam put-role-policy` call.
4. **Add a smoke-test GH Actions workflow** with a **trigger matrix**:
   - **PR**: *scoped* smoke — only scenarios whose paths changed (plus cross-cutting shared infra) deploy and run. Keeps PR feedback under ~20 min.
   - **Nightly cron**: *full* smoke — all 17 scenarios via `all-demo`.
   - **Push to main**: full smoke as the merge-verification run.
   - All three flow through a **single entrypoint script** (`./scripts/smoke.sh`) so the local-dev path and the CI path execute the same commands. Required env vars are enumerated in `.env.example` and asserted at script start.
5. **Per-scenario assertion bar** — this spec commits the *shape*, the *rules*, and the *auth-mode categorisation* of the bar (see Testing Strategy). The 17 specific row-values are produced in Phase 4 (one PR per scenario), each bound by the rules below. For each scenario the bar specifies: which DOM/text/network response = pass for "landing reachable", what state = pass for "login worked" (or skip per auth-mode categorisation), which CFN Outputs are asserted (presence + shape, not just non-empty). **Adversarial rule**: each row MUST cite a historical regression for that scenario where one exists in memory (e.g. FixMyStreet 2FA bypass, Minute `fetch()` under basic auth, PlanX demo seeding), and the chosen feature flow MUST exercise the codepath that bug touched. This converts "one feature" from arbitrary to bug-informed. **Deepening cadence**: after every regression that escapes smoke, the fix PR also extends the assertion bar for that scenario to catch the regression — making the local-optimum trap explicit and giving the team a forcing function for coverage growth.
6. **Teardown**: every smoke run ends with a **CFN delete** of `all-demo` (and any scoped scenario stacks) as `if: always()`. We do NOT add a runtime nuke tool (see ADR-4). Instead, the "CFN delete leaves orphans" risk is mitigated at **template-author time**: a phase-2 lint pass forbids `DeletionPolicy: Retain` / `RemovalPolicy.RETAIN` / `FinalSnapshot: true` / `DeletionProtection: true` in any scenario template unless explicitly justified with a `# justification:` comment that the lint allow-lists. New scenarios inherit this rule via CI. Net: orphans become a lint failure on the originating PR.
7. **Run artefact bundle**: every CI run uploads a bundle (Playwright traces + screenshots per scenario, CFN events for each stack, image SHAs deployed, CloudWatch tail of any service that failed health checks). Bundle is the debuggability contract — a red build must tell you which scenario, which SHA, and which assertion failed without a 30-minute dig.
8. **Flake policy**: Playwright retries=2; first-failure must upload artefacts; tests can be marked quarantined with an expiry date; CI fails the build if any test is quarantined past its expiry. Prevents trust erosion.
9. **Pin every floating image tag** in scenario CDK/templates to an immutable reference. Pinning strategy is committed below in Technical Decisions, not left to implementer interpretation.
10. **Adopt self-hosted Renovate** via `renovatebot/github-action` running on a schedule from this repo (no org App install). Configure Renovate to: track GHCR image digests on own images, track upstream container digests (tika, paperless-ngx-upstream), manage npm/composer/github-actions ecosystems. **Grouping is mandatory** (one PR per scenario for image digests; one weekly grouped PR per language ecosystem; security PRs ungrouped + labelled) to prevent firehose. Renovate PRs trigger the smoke pack; a green smoke gates merge so we cannot accidentally adopt a breaking dependency.

Net effect: an upstream image bump, an internal code change, or a Renovate digest bump all flow through the same gate. Breaking changes manifest as a failed smoke run with a screenshot diff/log instead of a user-reported bug.

### Scope

**In Scope:**

- Expand `cloudformation/scenarios/all-demo/template.yaml` to nest all 17 scenarios (currently nests 7).
- Long-lived AWS account inside ISB org SCP scope but exempt from ISB lease lifecycle, set up via a **one-off manual runbook** (ADR-3). Account placed as a child of `sandboxOu` so the 4 parent SCPs (`AwsNukeSupportedServices`, `Restrictions`, `ProtectISB`, `LimitRegions`) inherit. `WriteProtection` is not inherited. Investigation confirmed the three closed assumptions of this design (see Technical Decisions ADR-1). Runbook contents: account vending, OU placement, SCP-inheritance verification (including the ProtectISB role-creation deadlock check — fall back to root-OU placement with selective SCP attachment if the carve-out is absent), OIDC provider creation, deploy role creation. Account ID + role ARN committed to `docs/smoke-test-account-config.yml`.
- GitHub OIDC identity provider + IAM deploy role in the long-lived account, **created once via runbook**, not IaC. Role policy is committed to the runbook as the exact `aws iam put-role-policy` invocation; widening it requires a runbook update (which is a PR). The committed config file documents the *expected* role policy so drift can be detected (future enhancement) but day-1 we trust the runbook.
- **OIDC subject-claim filter**: trust policy accepts `repo:co-cddo/ndx_try_aws_scenarios:*` AND requires `repository_owner: co-cddo` as belt-and-braces against `pull_request_target` misuse. Primary fork defence is GitHub's documented behaviour: `pull_request` events from forks don't pass secrets/OIDC on public repos.
- **Deployment-environment gating with branch policy** (closes the in-repo-contributor exfiltration attack): GitHub deployment environment `smoke-test-deploy` configured so `refs/heads/main` auto-runs (no required reviewer; relies on main branch protection + CODEOWNERS), all other refs (PR branches) require approval from CODEOWNERS-listed reviewers. The workflow's deploy job MUST set `environment: smoke-test-deploy`. See Codebase Patterns for the full mechanism.
- **CODEOWNERS file** at `.github/CODEOWNERS` requires security/devops review for `/.github/workflows/smoke.yml`, `/scripts/smoke.sh`, `/tests/smoke/fixtures/**`, `/docs/smoke-test-account-setup.md`, `/docs/smoke-test-account-config.yml`. Makes "reviewer diligence" concrete via tooling rather than assumed.
- GitHub Actions workflow with a **trigger matrix**: PR-on-scenario-touch = scoped; nightly cron + push-to-main = full. Both run via the same entrypoint script (see below).
- **Single entrypoint script** `./scripts/smoke.sh` invoked identically by local and CI. Required env vars enumerated in `.env.example` and asserted at script start. Local auth = `--profile NDX/<TBD>` SSO; CI auth = OIDC. The script is the **test-invocation parity contract** (Playwright command is identical local + CI). Deploy/teardown parity is by-runbook-documentation: local operators follow the same `aws cloudformation deploy ... && ./scripts/smoke.sh && aws cloudformation delete-stack` sequence that the workflow runs, documented inline in `scripts/smoke.sh` comments. We do not unify the deploy/teardown steps into the script itself because their inputs differ between local (manual stack name choice) and CI (matrix-driven).
- **Per-scenario assertion bar** authored in Step 3 — explicit table of `(scenario, landing assertion, login assertion, feature flow, CFN Outputs checked)`. Each row is concrete enough that a fresh dev agent can implement the test without re-deriving "what does smoke mean for this scenario".
- Pin all `:latest` image references (minute x3, fixmystreet, planx x4, localgov-drupal, paperless-ngx + upstream tika) per the pinning strategy in Technical Decisions.
- Self-hosted Renovate via `renovatebot/github-action` with **grouping config** (one PR per scenario for image digests; one weekly grouped PR per language ecosystem; security PRs ungrouped + auto-labelled). Replaces or co-exists with current Dependabot config — final decision in Step 2 after auditing what Dependabot currently does.
- **Cleanup on every CI run**: CFN delete of `all-demo` (and any scoped scenario stacks) via `if: always()`. No third-party nuke tool — see ADR-4.
- **Retention-policy lint** in phase 2: extends the existing template-validation step in `.github/workflows/deploy-blueprints.yml` (which already enforces `<400KB`, no `AssetParameters`, DeletionPolicy checks) with checks for `DeletionPolicy: Retain`, `RemovalPolicy.RETAIN`, `FinalSnapshot: true`, `DeletionProtection: true` (and CDK equivalents). Each finding requires an inline `# justification:` comment OR fails the build.
- **Smoke-test account setup runbook** at `docs/smoke-test-account-setup.md` documenting the one-off manual setup (vending, OU placement, SCP verification, OIDC + role creation). NOT a CDK app. See ADR-3.
- **Run artefact bundle uploaded by every CI run**: Playwright traces+screenshots per scenario, CFN events for every stack, image SHAs deployed, CloudWatch tail of any failed service. Retention = 30 days.
- **Flake policy**: Playwright retries = 2, first-failure uploads full artefacts, tests can be `test.skip.fixme` quarantined with an expiry date in a fixture, CI fails the build if any test has been quarantined past its expiry.
- Region: **us-east-1 only** for the long-lived account and its deploys.

**Out of Scope:**

- Deep per-feature regression matrices for any scenario (smoke only; deeper tests can be added incrementally without changing the rails). **The per-scenario assertion bar IS enumerated** (we are explicit about which one feature flow per scenario), but we are not authoring exhaustive matrices.
- Visual regression / screenshot-diff testing (existing portal screenshot pipeline is unaffected; we are not adding pixel-diff gates to scenarios).
- Multi-region deploys / region failover testing.
- Performance, load, or chaos testing.
- Changes to Innovation Sandbox SCP *definitions* or to pool-account lease lifecycle.
- Migrating any non-ISB scenario (planx, bops-planning, digital-planning-register) onto ISB blueprints.
- Production traffic switchover or anything user-facing on www.try.ndx — this is internal CI infrastructure only.
- Sharing the smoke account with any other workload (perf, sec-scan, manual exploration) — the spec leaves the OU open for future siblings but commits no co-tenants on day 1.

## Context for Development

### Glossary

- **`sandboxOu`** — the parent OU in the ISB org tree whose children are `Active`, `Available`, `Frozen`, `CleanUp`, `Quarantine`, `Entry`, `Exit`. This is the variable name in ISB's CDK source; the actual AWS display name is discovered by enumeration in the runbook.
- **`IsbOuSchema`** — hardcoded enum in ISB Lambda source listing the OU names the drift-monitor iterates. Our new OU is NOT in this enum, so we are invisible to drift-monitor.
- **`ProtectISB`** — one of the 5 SCPs ISB attaches; denies actions on `InnovationSandbox-*` named resources (roles, StackSets, AWSControlTower). Inherited by accounts under `sandboxOu`. Source of the role-creation deadlock that the runbook tests for.
- **`OrganizationAccountAccessRole`** — auto-created admin role in every account vended via `aws organizations create-account`. Trust = the org-management account. The runbook uses it once to bootstrap the smoke account (create OIDC provider + deploy role).
- **`InnovationSandbox-ndx-*`** — role name prefix the Restrictions SCP enforces. Any IAM role making API calls must start with this prefix or be denied.
- **all-demo** — the umbrella nested-stack template at `cloudformation/scenarios/all-demo/template.yaml` that deploys every scenario via `AWS::CloudFormation::Stack` children. Currently nests 7; expanded to 17 by phase 2b.
- **blueprint** — an ISB-format CloudFormation template, packaged for the ISB StackSet pipeline. In this spec, "blueprint" is used interchangeably with "scenario template" when discussing what `deploy-blueprints.yml` publishes.
- **blueprints bucket** — the S3 bucket `ndx-try-isb-blueprints-568672915267` in us-east-1, owned by the hub account. Path convention: `scenarios/<name>/template.yaml`. Source-of-truth for `all-demo`'s `TemplateURL` references and for any direct scenario deploy.
- **smoke pack** — the suite of per-scenario tests under `tests/smoke/`. **smoke run** — one execution of the workflow. **smoke gate** — the PR-merge requirement that a smoke run pass.

### Codebase Patterns

**Nested-stack pattern (`all-demo/template.yaml`):** Each child stack uses `Type: AWS::CloudFormation::Stack`, `TemplateURL: https://${TemplateBucket}.s3.${TemplateBucketRegion}.amazonaws.com/scenarios/{name}/template.yaml`, parameters limited to `Environment` only (or none for localgov-drupal), `TimeoutInMinutes` ranges 10-60 per scenario, and consistent Tags: `Project=ndx-try`, `Scenario={name}`, `ParentStack=!Ref AWS::StackName`, `awsApplication=!GetAtt AppRegistryApplication.Arn`. AppRegistry application is named `NDXTry_All_Scenarios_${AWS::AccountId}`. To add a scenario: append a new `AWS::CloudFormation::Stack` resource matching this shape, plus an Output forwarding the child's primary URL.

**CDK hub-app pattern (`cloudformation/isb-hub/`):** Single-file `bin/app.ts` instantiates one stack; `lib/isb-hub-stack.ts` defines constants (`HUB_ACCOUNT='568672915267'`, `ISB_NAMESPACE='ndx'`, `BLUEPRINTS_BUCKET_NAME='ndx-try-isb-blueprints-{HUB_ACCOUNT}'`), imports an existing S3 bucket via `Bucket.fromBucketName`, imports the OIDC provider via `OpenIdConnectProvider.fromOpenIdConnectProviderArn`, defines a GH Actions IAM role with explicit `roleName`, and creates per-scenario `BucketDeployment` + `CfnStackSet` resources. **Smoke-test account setup does NOT follow this pattern** — it is a manual runbook (ADR-3), not a CDK app. The OIDC provider and deploy role exist inside the smoke-test account, created once via `aws iam` CLI commands documented in `docs/smoke-test-account-setup.md`.

**OIDC role trust pattern:** Existing `isb-hub-github-actions-deploy` role uses:
- `StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' }`
- `StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:co-cddo/ndx_try_aws_scenarios:ref:refs/heads/main' }`

This trust is **branch-locked to main**. Our smoke role needs a broader pattern to allow PR runs, but must reject fork PRs. The committed pattern is `repo:co-cddo/ndx_try_aws_scenarios:*` with an additional `repository_owner=co-cddo` claim — implemented as a second `StringEquals` on `token.actions.githubusercontent.com:repository_owner`.

**Deployment-environment gating (required, not optional).** The deploy job in `smoke.yml` MUST declare `environment: smoke-test-deploy`. The `smoke-test-deploy` environment in the repo settings uses a **deployment branch policy**:

- `refs/heads/main` → **no required reviewer** (auto-runs). Justification: main is itself branch-protected; CODEOWNERS on `.github/workflows/smoke.yml`, `scripts/smoke.sh`, `tests/smoke/fixtures/**` requires a security/devops reviewer for any change to these paths BEFORE the change reaches main. The gate is conceptually "did this code reach main?", enforced at PR-merge time, not at run-time.
- All other refs (PR branches) → **required reviewer** from the same CODEOWNERS set.

This combination defeats the in-repo-contributor exfiltration attack: a PR that modifies sensitive files cannot run with deploy credentials until a CODEOWNERS reviewer approves the environment AND reviews the diff. Nightly cron from main runs unattended because its code path was already reviewed at merge.

**Doctrinal note**: GitHub issues the OIDC token to the job, but the job that uses the token does not start until environment approval is granted. So while "before OIDC issuance" is imprecise, the effect is the same: a malicious modification cannot execute with deploy credentials without human approval (PR) or prior branch-protected merge (main).

**Fork PR defence**: GitHub's documented `pull_request` event behaviour does NOT pass secrets/OIDC to fork-originated workflow runs on public repos. That is the actual fork defence. The OIDC trust policy's `repository_owner=co-cddo` filter is belt-and-braces against `pull_request_target` misuse, not the primary protection.

**StackSet pattern:** `permissionModel: 'SELF_MANAGED'`, `administrationRoleArn: arn:aws:iam::{HUB_ACCOUNT}:role/InnovationSandbox-ndx-IntermediateRole`, `executionRoleName: 'InnovationSandbox-ndx-SandboxAccountRole'`, `capabilities: [CAPABILITY_IAM, CAPABILITY_NAMED_IAM, CAPABILITY_AUTO_EXPAND]`. **The smoke pack does not create StackSets** — it deploys `all-demo` as a regular nested stack directly into the smoke-test account.

**Existing CI template-validation step (in `deploy-blueprints.yml`):** Each synth job strips CDK bootstrap metadata, asserts template < 400KB, asserts no `AssetParameters`, asserts proper DeletionPolicy. **Phase 2's retention-policy lint extends this same validator** with checks for `DeletionPolicy: Retain` / `RemovalPolicy.RETAIN` / `FinalSnapshot: true` / `DeletionProtection: true`, requiring an inline `# justification:` comment when present.

**Playwright pattern:** `playwright.config.ts` at repo root with `testDir: './tests'`, two projects (Desktop Chrome 1280x800, mobile iPhone SE 375x667), `baseURL: process.env.BASE_URL || 'http://localhost:8080'`, `fullyParallel: !process.env.CI`, workers=1 on CI, webServer auto-starts `http-server _site -p 8080`. **Smoke pack adds a third project** for `tests/smoke/**/*.spec.ts` that does NOT spin up the webServer and does NOT use `baseURL`. Each smoke test resolves its own URL at test time by calling `describe-stacks` on the smoke account via the `tests/smoke/fixtures/cfn-outputs.ts` helper. Login flow is per-test using credentials read from CFN outputs. Smoke project sets `trace: 'retain-on-failure'`, `screenshot: { mode: 'only-on-failure' }`, and uses Playwright's `mask` option to redact password input fields from screenshots so artefact bundles don't leak credentials.

**Network-trace credential redaction (closes a trace-leak risk):** Playwright's trace recorder captures network requests verbatim, including form-encoded passwords from `page.fill('input[type=password]', creds.sensitiveValue())`. Screenshot masking is not enough. The spec adds `tests/smoke/fixtures/secure-form.ts` exposing `fillPassword(page, selector, value)` which:
1. Registers a `page.route` handler that intercepts the next matching POST and rewrites the form-encoded value of the sensitive key (`password`, `pwd`, configurable) to `REDACTED-<hash>` BEFORE the request continues. The redacted body is what lands in the trace.
2. Calls `page.fill(selector, value)` after the route handler is registered.
3. Removes the route handler after the next matching POST.

Test authors MUST use `fillPassword` instead of `page.fill` for credential entry. A `tests/smoke/fixtures/eslint-rule.js` (or a grep-based lint in smoke.yml) flags raw `page.fill` calls against `type=password` selectors in `tests/smoke/**/*.spec.ts` to enforce.

**`cfn-outputs.ts` helper — secret-redaction contract:** Helper MUST mark Output keys matching `/(Password|Secret|Token|Credentials|Creds|Login|ApiKey|ConnectionString|PrivateKey|Passphrase)/i` as sensitive. The regex is broader than first-pass to catch `AdminCreds`, `DefaultLogin`, `BootstrapKey`, `ApiKey`, `DBConnectionString`, etc. **Plus an opt-in mechanism**: any CFN Output carrying `Metadata: { Sensitive: true }` is forced-redacted regardless of name. After Phase 4 has landed all 17 scenarios, an audit pass reviews every Output across the deployed `all-demo` for missed-sensitive items and adds `Metadata.Sensitive: true` where the regex didn't catch (e.g. `Bootstrap`, `Welcome*`). Helper returns a typed result distinguishing `value: string` (safe to log) from `sensitiveValue: () => string` (callable accessor that never appears in stringification). Sensitive values are never `console.log`'d, never asserted by value (assertions on them must use length or shape, not the raw string), and are masked in any failure message and Playwright trace.

**Smoke env-var scheme** (distinct from visual-regression `BASE_URL`): `SMOKE_STACK_NAME` (default `all-demo`), `SMOKE_AWS_REGION` (`us-east-1`), `SMOKE_AWS_PROFILE` (local only — SSO profile), plus AWS credentials from the OIDC role on CI. All asserted at the top of `scripts/smoke.sh` so missing env fails fast with a useful message. `BASE_URL` is deliberately unset for the smoke project; mixing it would pull tests back to the portal site.

**Smoke-test config file (`docs/smoke-test-account-config.yml`) — schema, format, consumer:**

```yaml
# This file is the post-runbook state record. Mutated only by re-running the
# runbook (a rare event). Not Renovate-managed.
smoke_test_account_id: "123456789012"
smoke_test_deploy_role_arn: "arn:aws:iam::123456789012:role/InnovationSandbox-ndx-SmokeTestDeployRole"
smoke_test_region: "us-east-1"
smoke_test_ou_id: "ou-xxxx-xxxxxxxx"
smoke_test_ou_placement_branch: "child-of-sandboxOu"   # or "child-of-root-with-selective-scps" if ProtectISB blocked
sandbox_ou_id: "ou-yyyy-yyyyyyyy"                       # captured during the OU lookup step
expected_scps:                                          # list of policy IDs attached to smoke_test_ou_id at setup; SCP drift check compares live state to this
  - "p-tyb1wjxv"
  - "p-gn4fu3co"
  - "p-..."
setup_date: "2026-MM-DD"
runbook_version: "<commit-sha-of-runbook-at-the-time-of-setup>"
```

Format: YAML (consistent with `dependabot.yml`/`renovate.json` neighbours). Consumer: `.github/workflows/smoke.yml` reads via `yq` (or `actions/github-script` + `js-yaml`); `scripts/smoke.sh` reads the same fields locally. Lifecycle: file is committed; updates require a PR; if it ever falls out of sync with the live account state, the runbook's "verify state" section is the reconciliation source.

**Public-repo disclosure note.** `co-cddo/ndx_try_aws_scenarios` is public-by-design. `docs/smoke-test-account-config.yml` commits the smoke account ID, the deploy role ARN, OU IDs, `expected_scps`, and the runbook commit SHA. None of these values are AWS secrets per AWS guidance (account IDs and role ARNs are not credentials). The security model relies on (a) GitHub's `pull_request`-from-fork secret-isolation behaviour, (b) the OIDC trust policy's `repository_owner` claim filter (belt-and-braces against `pull_request_target` misuse), (c) the `smoke-test-deploy` GitHub deployment environment with deployment-branch-policy gating, (d) CODEOWNERS-enforced review on sensitive paths, (e) iterate-to-least-privilege IAM, and (f) the quarterly audit. NOT on hiding the config values.

**Schema-allowlist enforcement (closes the future-drift risk)**: a CI lint step on PRs touching `docs/smoke-test-account-config.yml` validates that any added field appears in a static allowlist defined inline. PRs adding fields outside the allowlist (e.g. a new `api_key` field) fail CI. Allowlist update requires a separate PR with security/devops CODEOWNERS approval. Mechanism: `yq` extracts top-level keys; compares to an allowlist constant in the lint script. **Do NOT commit anything to this file that is materially secret** (passwords, API keys, internal hostnames not already published). If a future field would carry secret material, use GitHub secrets or AWS Secrets Manager instead.

**SCP attachment target for smoke-test account (runbook step):** The new OU is created as a **child of `sandboxOu`** (same parent as ISB's `Active` OU), so it automatically inherits the 4 parent SCPs (AwsNukeSupportedServices, Restrictions, ProtectISB, LimitRegions). We do NOT additionally attach WriteProtection. This faithfully reproduces an *Active sandbox* SCP profile. **ProtectISB role-creation deadlock check**: the runbook includes a verification step — attempt to create `InnovationSandbox-ndx-SmokeTestDeployRole` from `OrganizationAccountAccessRole`. If ProtectISB blocks the create, fall back to placing the account under root (sibling of `sandboxOu`) and selectively attach Restrictions + LimitRegions + AwsNukeSupportedServices (skip ProtectISB). Runbook documents which branch was taken.

**ISB lifecycle Lambdas are OU-filtered** (drift-monitor iterates a hardcoded `IsbOuSchema` enum: Available, Active, Frozen, CleanUp, Quarantine, Entry, Exit; event-driven handlers like AccountLifecycleManager / InitializeCleanup take account IDs from event payloads, not enumeration). A sibling OU is invisible to all of them. ADR-1 assumption confirmed.

**Scenarios missing CFN Outputs in committed templates:** bops-planning, digital-planning-register, fixmystreet, localgov-ims, paperless-ngx, planx, simply-readable have CDK source but no `Outputs:` section in any committed template (synth is not committed). Smoke pack reads outputs from the *deployed* stack via `aws cloudformation describe-stacks --stack-name X --query 'Stacks[0].Outputs'` — works regardless of synth-commit status. **However**, for `all-demo` to *nest* a scenario, it needs a TemplateURL pointing at S3, which means the scenario must publish a synthesized template. Phase 2 must verify each missing scenario has (or adds) a synth pipeline that lands at `scenarios/{name}/template.yaml`. The current `deploy-blueprints.yml` only synths 6 scenarios; the rest (planx, bops-planning, digital-planning-register, ai-contact-centre) need either synth jobs added or confirmation they're built another way.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/all-demo/template.yaml` | Nested-stack pattern; primary edit target for phase 2 |
| `cloudformation/isb-hub/bin/app.ts` | CDK entry-point pattern (reference only; smoke-test account is manual, not CDK) |
| `cloudformation/isb-hub/lib/isb-hub-stack.ts` | OIDC + IAM role reference patterns (for the *runbook* to mirror as CLI commands) |
| `docs/smoke-test-account-setup.md` | The runbook (created in phase 1); single source of truth for account/OU/SCP/OIDC/role setup |
| `docs/smoke-test-account-config.yml` | Committed account ID + deploy role ARN; consumed by `.github/workflows/smoke.yml` |
| `.github/dependabot.yml` | Current 7-group config to port into `renovate.json` then delete (phase 6) |
| `.github/workflows/deploy-blueprints.yml` | Existing OIDC + synth + template-validation pattern; phase 1 smoke workflow mirrors auth setup; phase 2 retention lint extends the validation step |
| `.github/workflows/build-deploy.yml` | Concurrency-group pattern; Pages deploy reference (not directly used) |
| `playwright.config.ts` | Existing Playwright config; smoke pack adds a project entry, not a new config file |
| `package.json` (root) | Adds `test:smoke` script; existing `test:playwright`, `test:visual` patterns to mirror |
| `cloudformation/scenarios/fixmystreet/cdk/lib/constructs/compute.ts:97` | `:latest` surgery site (1) |
| `cloudformation/scenarios/planx/cdk/lib/constructs/compute.ts:81,137,212,304,353` | `:latest` surgery sites (4, plus ghcrPrefix variable) |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts:275` | `:latest` surgery site (1) |
| `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts:165,191` | `:latest` surgery sites (2 upstream) |
| `cloudformation/scenarios/minute/template.yaml:1943,2325,2604` | `:latest` surgery sites (3, in raw CFN JSON-in-YAML) |
| `~/httpdocs/innovation-sandbox-on-aws-utils/.../isb-account-pool-resources.ts:123-189` | Reference for the 5 ISB SCPs; confirms placement strategy |
| `~/httpdocs/innovation-sandbox-on-aws-utils/.../account-drift-monitoring-handler.ts:178-186` | Reference for ISB lifecycle enumeration strategy; confirms sibling-OU invisibility |

### Technical Decisions

**Headline decisions:**

- **Scope = single spec** covering all 5 strands (account, all-demo, OIDC, smoke pack, pinning + Renovate).
- **Test depth = smoke only** per scenario (login + landing + one feature + CFN Outputs check). Deeper feature matrices are explicitly deferred.
- **Region = us-east-1 only.**
- **Renovate, not Dependabot, for Docker pins.** Self-hosted via `renovatebot/github-action@v40` (or current), authed with a fine-grained PAT in `RENOVATE_TOKEN` secret. Org-level Renovate App install is not available.
- **Long-lived test account placement = Option A** (child of `sandboxOu`, inheriting 4 parent SCPs). Detail in ADR-1.

#### ADR-1: Where does the long-lived smoke-test account live?

Four placements considered:

| Option | Placement | SCP source | ISB lifecycle interference | Drift risk |
|---|---|---|---|---|
| **A (chosen)** | New sibling OU under ISB org root | Attach *same* ISB SCP policy IDs | None — ISB Lambdas iterate known OUs only | Zero (same policy objects) |
| B | Reuse an existing ISB OU (e.g. `Frozen`) | Inherited | High — ISB Lambdas operate on these OUs | Zero |
| C | Account directly under root, SCPs attached to account | Same IDs, attached at account level | None | Zero, but per-account toil; SCP attachment at account level is discouraged |
| D | New OU outside the ISB org tree, with copied SCP definitions | Mirrored policies | None | High — drifts whenever ISB SCPs evolve |

**Chose A because** it is the only option that gives faithful production SCP reproduction (same policy IDs, not copies) and zero ISB lifecycle interference. The original framing of "IaC the OU + account in CDK" was superseded by ADR-3 — placement is now done manually via runbook. The *choice of placement* (child of sandboxOu) survives unchanged.

**Placement specificity:** ISB attaches **5 distinct SCPs**. Four (`AwsNukeSupportedServicesScp`, `RestrictionsScp`, `ProtectISBScp`, `LimitRegionsScp`) attach to the `sandboxOu` parent and inherit downward; one (`WriteProtectionScp`) attaches only to Available/CleanUp/Quarantine/Entry/Exit — NOT to `Active`. To faithfully reproduce the SCP profile an *active sandbox account* operates under, the new OU is created as a **child of `sandboxOu`** (same parent as ISB's `Active` OU), so it inherits the 4 parent SCPs automatically and does NOT pick up WriteProtection. Runbook step.

**ProtectISB role-creation deadlock — fallback branch**: ProtectISB denies all actions on `InnovationSandbox-*` roles. The runbook attempts to create `InnovationSandbox-ndx-SmokeTestDeployRole` using `OrganizationAccountAccessRole`; if the create is denied, the fallback is to move the account from "child of sandboxOu" to "child of root" and explicitly attach Restrictions + LimitRegions + AwsNukeSupportedServices (skipping ProtectISB). The fallback loses ProtectISB-driven faithfulness (so smoke under fallback will NOT reproduce historical regressions like role-name-prefix denials or Secrets Manager blocks against `InnovationSandbox-*` resources). Runbook records which branch was taken in `smoke_test_ou_placement_branch`. **If fallback was taken, the runbook MUST open a tracked issue tagged `scp-fallback-revisit` with a 6-month review cadence**, so we don't quietly accept a less-faithful environment forever.

**Lambda invisibility:** ISB's drift-monitor (`account-drift-monitoring-handler.ts:178-186`) iterates a hardcoded `IsbOuSchema` enum that does NOT include our new OU. Other lifecycle handlers (`AccountLifecycleManager`, `InitializeCleanup`) are event-driven and take account IDs from SQS payloads — they do not enumerate accounts. The new OU and its account are invisible to every lifecycle handler.

**Looking up `sandboxOu` ID for the runbook:** The runbook walks the operator through identifying the right OU once. `sandboxOu` is the *variable name* in ISB's CDK; the actual OU display name is something like `InnovationSandboxAccountPool`. Identify it by enumerating children of root (`aws organizations list-roots --query 'Roots[0].Id'` → `aws organizations list-organizational-units-for-parent --parent-id <root-id>`) and finding the OU whose children are named `Active`, `Available`, `Frozen`, `CleanUp`, `Quarantine`, `Entry`, `Exit`. Record the discovered ID in `docs/smoke-test-account-config.yml` and in the runbook's audit trail.

**Implication for the GH Actions deploy role:** SCP `p-tyb1wjxv` denies API calls from roles whose names do not match `InnovationSandbox-ndx-*`. The OIDC deploy role we create in the smoke-test account MUST therefore be named with that prefix (e.g. `InnovationSandbox-ndx-SmokeTestDeployRole`) or it will be denied by the SCP it is supposedly bound by. This is intentional — it forces the test rig to operate under the same role-naming discipline as the scenarios it deploys.

#### Pinning strategy (committed)

| Image source | Deployed reference | Renovate manager | Update flow |
|---|---|---|---|
| **Our own GHCR** (`ghcr.io/co-cddo/ndx_try_aws_scenarios-<x>`) | `:sha-<7chars>@sha256:<digest>` — the `sha-<7chars>` tag is published by every docker-build workflow via `docker/metadata-action` (`type=sha,prefix=sha-`); verified Step 2. Digest is appended for tamper-resistance. | `regex` (custom) matching `ghcr.io/co-cddo/ndx_try_aws_scenarios-<x>:sha-([a-f0-9]+)@sha256:([a-f0-9]+)`, datasource = docker, currentDigest extraction | Renovate watches `:latest` on GHCR, resolves the digest, opens a PR that updates BOTH the `sha-<7chars>` tag AND the digest; smoke gates merge |
| **Upstream pinned releases** (e.g. `ghcr.io/paperless-ngx/paperless-ngx`) | `:<semver>@sha256:<digest>` | `regex` (custom — matches CDK TypeScript string literals; Renovate's built-in `docker` manager covers only Dockerfile/compose/k8s/helm, NOT CDK `fromRegistry()` calls) | Renovate opens PR on new semver release, including the new digest; smoke gates merge |
| **Upstream rolling tag** (e.g. `docker.io/apache/tika`) | `:<datestamp-or-major>@sha256:<digest>` — *never* deploy a bare `:latest@sha256:...` because Renovate cannot track that meaningfully | `regex` (custom — same as above) | Renovate watches the chosen tag (e.g. `apache/tika:3.0`), proposes digest bumps |

**Anti-pattern explicitly rejected:** pinning to a bare digest with no readable tag (`@sha256:...` only). Renovate has nothing to follow → the pin becomes frozen forever. Every pin must carry a Renovate-trackable tag alongside the digest.

**Renovate grouping rules (committed; phase 6 implements verbatim):**

| Group name | Matches | PR cadence | Why |
|---|---|---|---|
| `scenario-<name>-images` | All images in `cloudformation/scenarios/<name>/**` (one group per scenario) | As-available, immediate | One PR per scenario → smoke runs scoped to that scenario → fast feedback |
| `npm-dev` | `devDependencies` across all `package.json` files | Weekly, Monday | Low-risk, batched to avoid noise |
| `npm-prod` | `dependencies` across all `package.json` files | Weekly, Monday | Higher-risk, but still batched — smoke gates regardless |
| `composer` | `localgov-drupal` composer deps | Weekly, Monday | Same as npm-prod, separate ecosystem |
| `github-actions` | `.github/workflows/**` action references | Weekly, Monday | Batched; action bumps rarely break |
| `security-priority` | Any dep flagged by `osvVulnerabilityAlerts: true` | Immediate, ungrouped | CVE response — never batch a fix |

`osvVulnerabilityAlerts: true` is required so Renovate gates known-vulnerable upstream versions. Smoke runs on every Renovate PR; merge gated by green smoke regardless of group.

#### ADR-2: Renovate replaces Dependabot entirely (chosen)

| Option | Pros | Cons |
|---|---|---|
| **A. Renovate replaces Dependabot entirely (chosen)** | One bot, one config, one PR style. Renovate's npm/composer/github-actions managers are equivalent or better. Single grouping strategy. | Migration cost: delete `dependabot.yml`, port schedules into `renovate.json`. |
| B. Co-exist (Dependabot for languages, Renovate for Docker) | Zero migration cost. | Two bots opening PRs for same targets is the firehose we want to avoid. Two configs forever. |
| C. Renovate-only via Dependabot importer | Theoretical low migration cost. | No first-party importer exists; community scripts are partial. Realistic = same work as A with indirection. |

Phase 6 deletes `dependabot.yml` in the same PR that introduces `renovate.json` + the `renovatebot/github-action` workflow. Phase 5 (pinning) ships before phase 6 so Renovate's first PRs land against trackable references. Any in-flight Dependabot PRs at phase-6 merge time are merged or closed; we do not orphan PRs.

#### ADR-3 (revised): Smoke-test account setup is a one-off manual runbook, not a CDK app

| Option | Pros | Cons |
|---|---|---|
| A. Extend `cloudformation/isb-hub/` to host org-management + smoke-test stacks | Single CDK app. | Mixes security-sensitive org-management code with routine blueprint sync. |
| B. New sibling CDK app `cloudformation/smoke-test-hub/` with two stacks (OrgManagement + SmokeTestAccount) | Causally-coupled stacks share an app boundary. | A CDK app touching org-management state runs on every deploy. Even with `cdk diff` review, the blast-radius of a wrong deploy on org-management is high. Bootstrap chicken-and-egg: the OIDC trust into org-management doesn't exist at first deploy → first deploy is manual anyway. |
| C. Three separate CDK apps | Maximum isolation. | Three apps to maintain. |
| **D. Manual runbook (chosen)** | Zero CDK touching org-management state, ever. The setup is genuinely one-off (account vending, OU placement, SCP attachments, OIDC + role creation) — none of these naturally need re-running on a schedule. Operator runs ~10 CLI commands once, records account ID + role ARN in a committed config file, and the rest of the spec (phases 2-6) is fully automated CI/CD. The ProtectISB role-creation deadlock is handled interactively (try the placement, fall back if it fails) without a CFN rollback dance. | Org-management state is not git-versioned as code. Mitigation: the runbook IS the versioned artefact; `git log docs/smoke-test-account-setup.md` shows when the procedure changed. A future maintainer wanting idempotent re-setup can port the commands to a shell script. Updating the deploy role's policy is a manual `aws iam put-role-policy` call, documented in the runbook — accepted because it is rare. |

**Chose D because** the user is (rightly) nervous about a CDK app touching org-management on every PR. The set-once-and-forget nature of the work doesn't justify the operational footprint of a CDK app. If org-management changes become frequent or auditability becomes critical, revisit — porting the runbook to CDK later is straightforward.

**Role-policy update discipline (closes a drift risk):** Any future update to `InnovationSandbox-ndx-SmokeTestDeployRole`'s policy lands FIRST as a PR-to-runbook (which updates the exact `aws iam put-role-policy` command + the expected policy JSON committed alongside). Operator then applies the merged runbook update. This keeps the runbook as the source of truth and prevents drift between "what the role actually has" and "what we documented it has."

#### Deploy-role IAM policy outline (committed in Phase 1a runbook; T3.6 references it)

The runbook's `aws iam put-role-policy` step attaches an inline policy to `InnovationSandbox-ndx-SmokeTestDeployRole` covering roughly:

| Action group | Resources | Why |
|---|---|---|
| `cloudformation:CreateStack`, `UpdateStack`, `DeleteStack`, `DescribeStacks`, `DescribeStackEvents`, `DescribeStackResources`, `ListStackResources`, `GetTemplate` | `arn:aws:cloudformation:us-east-1:<smoke-account>:stack/all-demo*` and nested-stack ARNs | Deploy + introspect + delete `all-demo` and its nested stacks |
| `s3:GetObject` | `arn:aws:s3:::ndx-try-isb-blueprints-568672915267/scenarios/*` | Read templates referenced by `all-demo` from the blueprints bucket |
| `iam:PassRole` | `arn:aws:iam::<smoke-account>:role/InnovationSandbox-ndx-*` | Allow CFN to pass scenario-created roles (constrained by name prefix per Restrictions SCP) |
| Enumerated per scenario (derived from CDK source) — see below | Scoped where possible; wildcarded only inside SCP-enforced bounds | Scenario CFN templates create these resources. SCP bounds the wildcard's blast radius. |

**Enumerated action set (Phase 1a runbook commits this verbatim as policy JSON):**

| Action prefix | Used by | Notes |
|---|---|---|
| `ec2:*` (VPC, subnet, IGW, NAT GW, route table, EIP, SG, ENI) | All VPC-using scenarios | Constrained by tag conditions where ECS/RDS allows |
| `ecs:*`, `elbv2:*`, `autoscaling:*` | Fargate scenarios (drupal, planx, fixmystreet, paperless, ims, ai-contact-centre, minute) | Cluster + service + task-def lifecycle |
| `rds:*`, `aurora:*` | drupal, planx, ims, paperless | Including final-snapshot suppression for the retention lint to be effective |
| `efs:*` | drupal, fixmystreet, paperless | Access-point management |
| `lambda:*`, `apigateway:*` | All Lambda-FunctionURL scenarios | Plus `lambda:InvokeFunctionUrl` (recall ISB needs both function-URL perms) |
| `bedrock:InvokeModel`, `bedrock:Retrieve` | council-chatbot, simply-readable, planning-ai, foi-redaction, ai-contact-centre | Resource-scoped to model ARNs |
| `quicksight:*` | quicksight-dashboard | Subscription must be pre-enabled |
| `iam:CreateRole`, `DeleteRole`, `PutRolePolicy`, `AttachRolePolicy`, `DeleteRolePolicy`, `DetachRolePolicy`, `PassRole`, `TagRole` | All scenarios | Constrained to role names matching `InnovationSandbox-ndx-*` |
| `kms:*` | All scenarios using customer-managed keys | Scoped to keys created by scenario stacks |
| `logs:*` | All scenarios | CloudWatch log groups for ECS tasks, Lambdas |
| `ssm:GetParameter`, `PutParameter`, `DeleteParameter` | All scenarios using SSM Parameter Store | Including SecureString |
| `secretsmanager:*` | drupal, planx, ims, paperless (DB credentials) | Note: SCPs allow this — confirmed in runbook |
| `s3:*` | All scenarios | Plus the blueprints-bucket read permission already listed |
| `dynamodb:*` | smart-car-park, ai-contact-centre, council-chatbot | Table + item operations |
| `cloudfront:*` | drupal, fixmystreet, minute, planx, ai-contact-centre | Distribution + origin config |
| `route53:ChangeResourceRecordSets` | (if any scenarios provision DNS) | Verify per scenario |
| `sns:*`, `sqs:*` | ai-contact-centre, minute (Celery), council-chatbot | Topic + queue + subscription |
| `appregistry:*` | All scenarios (AppRegistry tagging) | Required by all-demo Tags pattern |
| `organizations:ListPoliciesForTarget` | Smoke pack drift check | `*` resource (Organizations doesn't support resource-level perms) |

**This table is the spec's source-of-truth upper bound.** Phase 1a runbook commits the literal JSON; updates land via PR-to-runbook. If a new scenario introduces a service prefix not on this list, the runbook PR adds it AND the deploy role's policy is updated by the operator.

**Iterate-to-least-privilege protocol (first 30 days post T1b)**: Spec acknowledges no IAM policy can be authoritatively scoped without observing every scenario's actual resource creation. The runbook's first deploy commits the **baseline** policy derived from the table above (wildcarded service prefixes with `aws:ResourceTag/Scenario` conditions where the service supports tag-based conditions). Then: enable CloudTrail in the smoke account; review access-denied events over the first 5 smoke runs; tighten the policy via PR-to-runbook for each unused permission or over-broad resource. Document the iteration in the runbook's Operational Notes. After 30 days, the policy stabilises; further updates follow the role-policy update discipline. This is the AWS-documented "iterate to least privilege" pattern, not a substitute for least-privilege.

**SCP-as-blast-radius reasoning REMOVED.** The original spec said "SCP bounds the wildcard's blast radius" as justification for `ec2:*`/`s3:*`. That's an anti-pattern — SCPs are organisation-wide policy guardrails, not least-privilege role policies. The iterate-to-least-privilege protocol above is the actual mechanism.

The runbook commits the literal policy JSON; T3.6 does not re-derive it. Updates land via PR-to-runbook per the role-policy update discipline above.

#### ADR-4: Cleanup = CFN delete only, lint retention policies at template-author time (chosen)

| Option | Pros | Cons |
|---|---|---|
| A. `aws-nuke` with strict denylist | Comprehensive. Battle-tested in sandbox cleanups. | Operational complexity (config maintenance, binary distribution, denylist drift). Aggressive-defaults risk. |
| B. Custom Lambda walker | Owned and understood. | Re-solves a solved problem; coverage gaps in obscure resource types. |
| C. `cloud-nuke` | Lighter than aws-nuke. | Weaker coverage on Bedrock/EFS/Aurora variants we use. |
| **D. CFN delete only, paired with a retention-policy lint at template-author time (chosen)** | Zero runtime tooling to maintain. Smoke-test account is SCP-bound: blast radius bounded. Lint prevents CFN-managed retention from sneaking in. | Lint is stronger for *retention introduced via CDK code*; it does NOT cover out-of-band resources (Lambda-created at deploy-time, application-created at runtime, mid-deploy ENIs, Bedrock provisioned throughput, log groups outliving stacks, S3 buckets created by user actions inside a scenario). Quarterly audit is the only backstop for those. Cost backstop is the same quarterly audit (per Testing Strategy), not an automated alarm. |

**Net consequence:** the orphan-resource failure mode moves from "midnight cost surprise" to "PR lint failure that the author fixes before merge." Authors will sometimes need a `# justification:` exception for a legitimate retention case, which is reviewed as part of the PR.

## Implementation Plan

### Phases — One Plan, Multiple PRs

This spec is one *plan* but expressly **NOT one PR**. Detailed tasks are grouped into the six phases below. Phases marked **independent** are unblocked by phase 1 and can ship in parallel. The point of naming phases here is to lock in the sequencing so a fresh implementer does not try to author smoke tests before OIDC exists, and so a phase blocked on org-management permission does not stall every other strand.

| # | Phase | Depends on | Independent? | Primary reviewer | Rollback cost |
|---|---|---|---|---|---|
| 1 | **Two deliverables**: (1a) Author `docs/smoke-test-account-setup.md` — the runbook — in a normal PR, reviewed for procedure correctness *before* any AWS changes. (1b) Operator executes the merged runbook, records outcomes in `docs/smoke-test-account-config.yml` (per the schema in Codebase Patterns), and PRs the config file. End-state: smoke-test account exists as a child of `sandboxOu` (or root if the ProtectISB role-creation check fails — runbook fallback branch); OIDC provider + `InnovationSandbox-ndx-SmokeTestDeployRole` exist inside it; Bedrock model access enabled; relevant service-quota increases requested; QuickSight subscription handled; config file committed. **Runbook contract — must contain four sections:** <br>1. **Prerequisites**: operator permissions (`organizations:CreateAccount` / `CreateOrganizationalUnit` / `MoveAccount` / `AttachPolicy`; ability to assume `OrganizationAccountAccessRole` into newly-created accounts), tools (`awscli` v2, `yq`), required awareness (this spec + ADR-1/3).<br>2. **Procedure**: numbered idempotent steps — each starts with a "does this resource already exist?" check (`aws iam get-role`, `aws organizations describe-organizational-unit`, etc.) and skips on existence. Each destructive step lists its inverse for mid-procedure rollback (e.g. "if `move-account` fails, account is in root; clean up via `aws organizations close-account` or retry"). Includes Bedrock model access enablement (exact model IDs determined during 1a authoring), service-quota requests (NAT GW / VPCs / EIPs / SES production), QuickSight decision, ProtectISB deadlock check + fallback.<br>3. **Verification**: read-only commands that confirm end-state (account exists, OU correct, role policy matches expected, OIDC provider thumbprint matches, Bedrock models invokable).<br>4. **Operational Notes**: `RENOVATE_TOKEN` rotation procedure + chosen expiration policy; quarterly cost-audit reminder; `expected_scps` maintenance when ISB upgrades; how to update the deploy role's policy (PR-to-runbook first, then operator applies). | Org-management access (for the operator running 1b) | No (this is the gating phase for 3 and 4) | Security / org admin reviews 1a; same reviewer + operator for 1b | High for 1b (account creation is hard to reverse — runbook includes "how to abort and clean up"). None for 1a. |
| 2a | Add synth pipelines to `.github/workflows/deploy-blueprints.yml` for the 4 currently-unsynthed scenarios (planx, bops-planning, digital-planning-register, ai-contact-centre); confirm all 17 land at `s3://ndx-try-isb-blueprints-{HUB_ACCOUNT}/scenarios/{name}/template.yaml` | None | **Yes** — independent of phase 1 | DevOps | None (revert workflow) |
| 2b | `all-demo` expansion to nest all 17 scenarios (depends on 2a's templates being in S3) **AND** retention-policy lint extension to the existing template-validation step (forbid `DeletionPolicy: Retain` / `RemovalPolicy.RETAIN` / `FinalSnapshot: true` / `DeletionProtection: true` without inline justification) | Phase 2a (templates published) | **Yes** — independent of phase 1 | DevOps | None (revert YAML / revert lint config) |
| 3 | Entrypoint script `scripts/smoke.sh` + GH Actions workflow skeleton + `tests/smoke/fixtures/cfn-outputs.ts` (implements the secret-redaction contract in Codebase Patterns) + `tests/smoke/fixtures/assertion-bar.ts` (empty table populated in phase 4). Consumes phase 1's account ID + role ARN from `docs/smoke-test-account-config.yml`. **Trigger matrix path-filter (committed at phase 3, not deferred)**: <br>- **Scoped smoke** when paths matching `cloudformation/scenarios/<name>/**` OR `tests/smoke/<name>.spec.ts` change — tests the union of changed scenarios.<br>- **Full smoke** (all 17 scenarios) when ANY of these change: `cloudformation/scenarios/all-demo/template.yaml`, `tests/smoke/fixtures/**`, `scripts/smoke.sh`, `playwright.config.ts`, `.github/workflows/smoke.yml`, root `package.json` (if `test:smoke` script changes), `docs/smoke-test-account-config.yml`, `.github/workflows/renovate.yml`. These are "rails" changes — any of them affects every scenario's smoke run, so a scoped trigger would be unsafe.<br>- Nightly cron and push-to-main always run the full set.<br>Workflow includes: (i) GHCR auth step (`docker login ghcr.io` using `GITHUB_TOKEN`); (ii) failure-notification (GH issue tagged `smoke-failed` or webhook); (iii) SCP drift check (`list-policies-for-target` vs `expected_scps` field in config, fail-soft on first detection then escalating per AC3.6/3.6b); (iv) **pre-deploy state check with auto-recovery** — if existing `all-demo` stack is in `DELETE_FAILED` or any `*_IN_PROGRESS` state, attempt auto-cleanup once (`continue-update-rollback` for stuck rollback, retry `delete-stack` for stuck delete); if auto-cleanup fails, the run proceeds against a unique recovery stack name `all-demo-recovery-<run-id>` so subsequent runs are NOT blocked, and a `stranded-stack` issue is opened with manual-resolution steps; (v) **per-stack teardown retry** — up to 3 attempts × 60s before declaring DELETE_FAILED, then log stack events to artefact bundle and open/update a `stranded-stack` issue. (vi) **`if: always()` on the artefact-upload step AND the teardown step** so a failing deploy mid-way still uploads partial artefacts before teardown attempts. **Phase 3 lays the rails; phase 4 consumes them.** | Phase 1 | No | DevOps | Low (delete workflow files) |
| 4 | Per-scenario smoke pack authoring (one PR per scenario, in priority order — flakiest / most-regressed first). Each PR populates one row of `assertion-bar.ts` and adds `tests/smoke/<scenario>.spec.ts`. | Phase 3 | No (per scenario, but order-independent within phase) | Scenario authors | None |
| 5 | Pinning sweep — replace all `:latest` with `<tag>@sha256:<digest>` per Technical Decisions. **Verified**: every docker-build workflow already publishes `sha-<short-sha>` tags via `docker/metadata-action` (`type=sha,prefix=sha-`), so our own GHCR images already have trackable immutable references. Phase 5 just resolves the digest for the most recent SHA tag of each image and rewrites the surgery sites; no docker-build workflow changes needed. | None | **Yes** — ships independently of phase 1. **MUST ship before phase 6** so Renovate's first PRs land against trackable references. | DevEx | None (revert pins) |
| 6 | Self-hosted Renovate workflow + grouping config; **delete `dependabot.yml`** in the same PR per ADR-2 | Phase 5 (something to bump) AND Phase 4 has merged at least the top-3 most-regressed scenarios (fixmystreet, planx, minute) — sufficient for Renovate PRs to be meaningfully gated. Not blocked by 100% phase-4 completion. | No | DevEx | Low (delete workflow + restore dependabot.yml) |

**Implication for the user**: phases 2 and 5 can be picked up and shipped immediately without waiting on org-management access. Phases 1, 3, 4, 6 sequence through the rails.

### Definition of Done (per phase)

- **Phase 1a**: runbook PR merged after review by security/org-admin reviewer. Runbook has the four required sections (see Phase 1 row): Prerequisites, Procedure (idempotent steps with per-step rollback), Verification, Operational Notes. Covers Bedrock model access enablement, service-quota requests, QuickSight decision, and the ProtectISB role-creation deadlock fallback branch.
- **Phase 1b**: smoke-test account exists, OIDC provider + `InnovationSandbox-ndx-SmokeTestDeployRole` exist inside it, `docs/smoke-test-account-config.yml` is committed and matches live state, runbook's "verify state" section all-green.
- **Phase 2a**: every scenario synthesises to S3 on push-to-main; `aws s3 ls s3://ndx-try-isb-blueprints-{HUB_ACCOUNT}/scenarios/` shows all 17 templates.
- **Phase 2b**: `all-demo` template nests all 17 scenarios; retention lint added to the existing template-validation step; a test PR introducing `DeletionPolicy: Retain` without justification fails CI; **a manual `all-demo` deploy into the smoke account (or any equivalently-quota'd account) succeeds end-to-end**. Without this real-deploy verification, quota cliffs only surface at phase 3 nightly cron and block that phase's DoD.
- **Phase 3**: a green nightly cron run completes against a manually-triggered `all-demo` deploy. Failure-notification mechanism tested by intentionally breaking a scenario (issue or webhook fires). SCP drift check tested by manually detaching a policy (drift-issue fires).
- **Phase 4**: every scenario has a landed `tests/smoke/<scenario>.spec.ts` file; `tests/smoke/fixtures/assertion-bar.ts` has 17 populated rows. **Done = at least 14/17 fully implemented** (rest may be skipped under the carve-out — see below). Partial coverage beyond this threshold breaks the "green smoke = all scenarios pass" contract that the merge gate relies on. **Untestable-scenario carve-out** (capped): if a scenario is blocked on an external dependency (e.g. SES production access pending, third-party API key procurement), an inline `test.skip.fixme('<reason>', { until: 'YYYY-MM-DD' })` counts as coverage IF (a) the expiry date is within 90 days, (b) the unblocking condition is recorded in the scenario's `assertion-bar.ts` row, (c) the flake-quarantine aging policy fails the build at expiry, AND (d) **at most 3 scenarios are in `test.skip.fixme` state at any time**. Without the cap, day-1 status could be "all 17 skipped, 100% covered" — the cap forces real progress.
- **Phase 5**: `grep -r ':latest' cloudformation/scenarios/` returns zero results (excluding `cdk.out`, `package-lock.json`); all surgery sites now show `<tag>@sha256:<digest>`.
- **Phase 6**: `.github/dependabot.yml` deleted; `renovate.json` and `.github/workflows/renovate.yml` merged; Renovate's first PR has opened against this repo; smoke gated that PR (whether it merged or not is irrelevant to DoD — only that the gate fired).

### Tasks

Tasks are grouped by phase. Within a phase, tasks are ordered by dependency.

#### Phase 1a — Author runbook + config schema

- [ ] **T1a.1**: Author `docs/smoke-test-account-setup.md`
  - File: `docs/smoke-test-account-setup.md` (new)
  - Action: Create the runbook with the four required sections (Prerequisites, Procedure, Verification, Operational Notes) per Phase 1 row in the Phases table.
  - Notes: Each step in Procedure begins with an idempotency check and includes its inverse for mid-procedure rollback. Bedrock model IDs to enable: enumerate by reading each AI-using scenario's CDK/template (ai-contact-centre, council-chatbot, simply-readable, planning-ai, foi-redaction) for `modelId` references and list the union.

- [ ] **T1a.2**: Author `docs/smoke-test-account-config.yml` (empty / template form)
  - File: `docs/smoke-test-account-config.yml` (new)
  - Action: Commit the schema shape with placeholder values (or comments) per the schema in Codebase Patterns. Phase 1b fills in real values.
  - Notes: Include all 8 fields. Add a top-of-file comment explaining the file lifecycle.

- [ ] **T1a.3**: PR review by security/org-admin
  - File: PR description
  - Action: Tag the security/org-admin reviewer on the PR. Reviewer challenges the procedure for correctness before any AWS changes.

#### Phase 1b — Execute runbook (one-off operator work)

- [ ] **T1b.1**: Operator follows the merged runbook end-to-end
  - File: AWS Organizations + the new account
  - Action: Run the Procedure section. Record outcomes including the placement branch taken (child-of-sandboxOu OR fallback child-of-root) and the `OrganizationAccountAccessRole` invocation logs.

- [ ] **T1b.2**: Populate `docs/smoke-test-account-config.yml` and PR
  - File: `docs/smoke-test-account-config.yml`
  - Action: Fill all 8 fields with actual values from the run. PR with the security/org-admin reviewer as approver.

#### Phase 2a — Synth pipelines for missing scenarios

- [ ] **T2a.1**: Audit current synth coverage
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: List the 6 synth jobs currently present; cross-reference against the 17 scenarios; identify which need new synth jobs (planx, bops-planning, digital-planning-register, ai-contact-centre per Step 2 findings).

- [ ] **T2a.2**: Add synth job for `planx`
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Add a synth job mirroring the `simply-readable` / `localgov-drupal` pattern: Node 22 + cache, `cdk synth`, strip bootstrap metadata, run template-validation, upload artefact for the deploy job.
  - Notes: planx CDK app entry at `cloudformation/scenarios/planx/cdk/bin/app.ts`. Output template must land at `s3://ndx-try-isb-blueprints-568672915267/scenarios/planx/template.yaml` after the deploy job.

- [ ] **T2a.3**: Add synth job for `bops-planning`
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Same pattern as T2a.2; entry at `cloudformation/scenarios/bops-planning/cdk/bin/app.ts`.

- [ ] **T2a.4**: Add synth job for `digital-planning-register`
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Same pattern; entry at `cloudformation/scenarios/digital-planning-register/cdk/bin/app.ts`.

- [ ] **T2a.5**: Make ai-contact-centre SAM packaging nestable
  - File: `.github/workflows/deploy-blueprints.yml`, `cloudformation/scenarios/ai-contact-centre/template.yaml`
  - Action: SAM packaging has two real obstacles for nesting:
    1. **CodeUri bucket alignment**: SAM produces a packaged template with `CodeUri: s3://<artifacts-bucket>/<hash>` where artifacts-bucket is typically `aws-sam-cli-managed-default-samclisourcebucket-*` — different from our blueprints bucket. Fix: invoke `sam package --s3-bucket ndx-try-isb-blueprints-568672915267 --s3-prefix scenarios/ai-contact-centre/code/` so artefacts and template share the blueprints bucket; the deploy role already has read on this bucket (per IAM outline). Verify by inspecting the packaged template's `CodeUri` values.
    2. **IAM resource prefix**: SAM auto-generated IAM names follow `<Stack>-<Resource>-<Hash>` and won't match `InnovationSandbox-ndx-*` — so the Restrictions SCP will deny their creation under nested stack deploy. Fix: ai-contact-centre's SAM template must EXPLICITLY name every IAM resource (e.g. `Properties: { RoleName: !Sub 'InnovationSandbox-ndx-AiCC-Lambda-${AWS::Region}' }`). This is a non-trivial template rework; treat as a sub-task that lands BEFORE T2b.1 nests ai-contact-centre in all-demo.
  - Notes: Proof of correctness is T2b.5b (real deploy). T2a.5 commits explicit roles in source + verifies packaged CodeUri targets the blueprints bucket. Both checks are pre-deploy verifiable.

- [ ] **T2a.6**: Verify all 17 scenarios in S3
  - File: N/A (verification)
  - Action: After a push-to-main run, `aws s3 ls s3://ndx-try-isb-blueprints-568672915267/scenarios/` and confirm 17 directories each containing `template.yaml`.

#### Phase 2b — `all-demo` expansion + retention lint

- [ ] **T2b.1**: Extend `all-demo/template.yaml` to nest all 17 scenarios
  - File: `cloudformation/scenarios/all-demo/template.yaml`
  - Action: For each missing scenario (ai-contact-centre, bops-planning, digital-planning-register, fixmystreet, localgov-ims, minute, paperless-ngx, planx, simply-readable), add an `AWS::CloudFormation::Stack` resource matching the existing pattern. Add corresponding `Outputs:` entries surfacing the primary URL of each.
  - Notes: TimeoutInMinutes per scenario based on its historical deploy time (e.g. localgov-drupal 60, planx 45, minute 30 — derive from observed deploys).

- [ ] **T2b.2**: Author retention-policy lint script (operates on synthesized CloudFormation, not CDK source)
  - File: `scripts/lint-retention-policies.sh` (new)
  - Action: Implement TWO checks:
    1. **Per-resource check**: scans `.template.json` outputs in `cdk.out/**` plus committed CFN templates. For each resource carrying `DeletionPolicy: Retain` or `UpdateReplacePolicy: Retain` (or nested `DeletionProtection: true` / `FinalSnapshot: true`), check for `Metadata: { Justification: "<text>" }`. Fail with `<template>:<resource>` if absent.
    2. **Second-order limit**: count total `Metadata.Justification` entries across all scenarios. Fail if count > 5 (configurable via env var). This forces reviewers to push back on blanket-justify use rather than mechanically adding justifications when CDK L2 defaults (S3 without `autoDeleteObjects`, KMS keys, RDS, log groups, DynamoDB tables) hit the lint.
  - Notes: **Lint targets synthesized CFN, not CDK source.** CDK can produce retention via many paths (`applyRemovalPolicy`, base-class defaults, aspects, escape-hatch overrides) — all surface as concrete attributes in synthesized output. Skeleton: `jq` walk over `Resources.*.DeletionPolicy` and `.UpdateReplacePolicy`, cross-reference against `Resources.*.Metadata.Justification`. Reusable locally: authors run `cdk synth && scripts/lint-retention-policies.sh` before pushing. **Each new `Metadata.Justification` SHOULD be accompanied by a follow-up issue committing to remove it; spec doesn't enforce this in code but reviewers should flag.**

- [ ] **T2b.3**: Wire `scripts/lint-retention-policies.sh` into the deploy-blueprints workflow
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Add a lint step **inside each synth job, AFTER `cdk synth` completes** (so the script sees the synthesized `.template.json`). Fail the synth job on non-zero exit. Plus one top-level lint pass over the committed CFN templates in `cloudformation/scenarios/*/template.yaml` (covers SAM-based scenarios with no synth step).

- [ ] **T2b.4**: Verify lint catches a test PR
  - File: a throwaway test PR
  - Action: Open a PR that adds `DeletionPolicy: Retain` (no justification) to a scenario. CI must fail with a clear error message identifying the file and line. Close PR after verification.

- [ ] **T2b.5a**: Pre-deploy quota matrix (iterative — initial best-effort, refined post-phase-4)
  - File: `docs/smoke-test-account-setup.md` (Operational Notes section) — appended via runbook update PR
  - Action: Before T2b.5b runs, compile a per-service expected-quota table. **Initial values are best-effort estimates derived from CDK source** (count NAT gateways, RDS instances, EFS per scenario). Bedrock TPM and SES volume are estimated upper-bound based on the scenario's CDK construct count. **The matrix is iterative**: refine via a follow-up runbook PR after phase 4 lands actual usage data. Initial table:
    - VPC: ≥ 17 (one per scenario at minimum)
    - NAT Gateway per AZ: ≥ 17
    - Elastic IP: ≥ 50 (NAT GW + load balancer EIPs)
    - RDS DB instances: ≥ 4 (drupal, planx, ims, paperless)
    - Aurora clusters: ≥ 1 (planx if Aurora)
    - ECS tasks (Fargate vCPU per region): match expected concurrent task load × 17 scenarios
    - EFS file systems: ≥ 5 (drupal, fixmystreet, paperless, plus margin)
    - Lambda concurrent executions: default 1000 is fine
    - Bedrock model TPM (tokens per minute) for active models: confirm against the smoke pack's per-test invocation count
    - SES: production mode required for FixMyStreet email send
    - QuickSight: Enterprise subscription required (per ADR-1 deferred decision)
  - For any default that's insufficient, file an AWS quota-increase ticket. Block T2b.5b until tickets close.
  - Notes: Survives in Operational Notes so re-running the runbook (or a new operator) sees the same expectations.

- [ ] **T2b.5b**: Manual `all-demo` deploy end-to-end
  - File: smoke-test account (or another **ISB-bound** account with the same SCP attachments)
  - Action: Trigger a manual `all-demo` deploy. Confirm all 17 nested stacks reach `CREATE_COMPLETE`. If quota cliffs surface despite T2b.5a, update the matrix and re-file quota tickets.
  - Notes: This is the DoD gate for phase 2b — the lint working is necessary but not sufficient; the real deploy proves quota sufficiency. **Phase 1 dependency is soft, but constrained**: T2b.5b can run against (a) the smoke account once phase 1 lands, OR (b) a temporary ISB pool lease (lifecycle-managed but SCP-correct). **The hub account is explicitly excluded** — its SCP profile differs and testing there does not reproduce the ProtectISB / role-prefix / Restrictions failure modes the spec exists to catch. Personal dev accounts outside the ISB org are also excluded for the same reason.

#### Phase 3 — Smoke rails

- [ ] **T3.1**: Add `smoke` project to Playwright config
  - File: `playwright.config.ts`
  - Action: Add a third project entry for `tests/smoke/**/*.spec.ts`. Set `trace: 'retain-on-failure'`, `screenshot: { mode: 'only-on-failure' }`. Conditionally disable `webServer` when `PLAYWRIGHT_SUITE === 'smoke'`. Smoke project does NOT use `baseURL`.

- [ ] **T3.2**: Author `tests/smoke/fixtures/cfn-outputs.ts`
  - File: `tests/smoke/fixtures/cfn-outputs.ts` (new)
  - Action: Implement helper that calls AWS SDK v3 `cloudformation:DescribeStacks` for `${SMOKE_STACK_NAME}` and returns a typed `Record<string, { value: string } | { sensitiveValue: () => string }>`. Sensitive detection: key matches `/(Password|Secret|Token|Credentials)/i`. Sensitive values never appear in `toString()` / `JSON.stringify` output.
  - Notes: Import from `@aws-sdk/client-cloudformation` (`CloudFormationClient`, `DescribeStacksCommand`). Authentication via default credential chain — OIDC env in CI, SSO profile locally; the helper does not configure credentials itself.

- [ ] **T3.3**: Author `tests/smoke/fixtures/assertion-bar.ts`
  - File: `tests/smoke/fixtures/assertion-bar.ts` (new)
  - Action: Define `AssertionBarRow` TypeScript type with `(landingAssertion, loginAssertion, featureFlow, outputsToCheck, historicalRegressionCited)`. Export an empty `Map<scenarioName, AssertionBarRow>` for phase 4 PRs to populate row-by-row.

- [ ] **T3.4**: Author `scripts/smoke.sh` entrypoint
  - File: `scripts/smoke.sh` (new)
  - Action: At top, assert `SMOKE_STACK_NAME`, `SMOKE_AWS_REGION` env vars exist. If `CI=true`, assume role via OIDC (handled by `aws-actions/configure-aws-credentials` upstream of this script). Else assume `SMOKE_AWS_PROFILE` SSO. Then `PLAYWRIGHT_SUITE=smoke npx playwright test --project=smoke "$@"`.
  - Notes: Fail-fast on missing env vars with a helpful message naming the missing var.

- [ ] **T3.5**: Author `.env.example`
  - File: `.env.example` (new)
  - Action: Document all required env vars: `SMOKE_STACK_NAME`, `SMOKE_AWS_REGION`, `SMOKE_AWS_PROFILE`. Include comments pointing at `docs/smoke-test-account-config.yml` for the account-specific values.

- [ ] **T3.6**: Author `.github/workflows/smoke.yml`
  - File: `.github/workflows/smoke.yml` (new)
  - Action: Implement trigger matrix:
    - `pull_request: paths: ['cloudformation/scenarios/**', 'tests/smoke/**']` → scoped smoke
    - `schedule: cron: '0 2 * * *'` → full smoke
    - `push: branches: [main]` → full smoke
    - `workflow_dispatch:` → manual full smoke
  - Permissions: `id-token: write`, `contents: read`, `issues: write` (for failure notification).
  - **Deploy job declares `environment: smoke-test-deploy`** (required — see Codebase Patterns "Deployment-environment gating"). Environment must be created in repo settings with required-reviewer protection BEFORE this workflow merges.
  - Steps: read `docs/smoke-test-account-config.yml` via `yq`; `aws-actions/configure-aws-credentials@v6` with role from config + `audience: sts.amazonaws.com`; `docker login ghcr.io` with `GITHUB_TOKEN`; SCP drift check (call `list-policies-for-target`, compare to `expected_scps` from config, open issue tagged `scp-drift` on mismatch, fail-soft); deploy `all-demo` (or scoped scenarios) via `aws cloudformation deploy`; run `./scripts/smoke.sh`; upload artefacts (Playwright traces + CFN events + image SHAs) with retention=30 days; on failure (cron only), open issue tagged `smoke-failed` OR post to `SMOKE_FAILURE_WEBHOOK` if defined; teardown via `aws cloudformation delete-stack` with `if: always()`.

- [ ] **T3.7**: Add `test:smoke` script
  - File: `package.json`
  - Action: Add `"test:smoke": "./scripts/smoke.sh"` to scripts.

- [ ] **T3.8b**: Author `.github/workflows/quarterly-audit.yml`
  - File: `.github/workflows/quarterly-audit.yml` (new)
  - Action: Cron `0 9 1 */3 *` (9am on the 1st of every 3rd month). Opens a GH issue tagged `quarterly-audit` from a templated body listing: (i) smoke account spend audit (`aws ce get-cost-and-usage`); (ii) orphan-resource sweep (compare live resources against expected resources from active CFN stacks); (iii) deploy-role policy actuals vs runbook-committed JSON (drift detection); (iv) SCP attachments live vs `expected_scps` in config; **(v) Renovate liveness check** — query `gh pr list --author renovate[bot] --search 'created:>30d ago'`; if zero PRs in 30 days, flag as a likely silent-death (broken token, broken regex, expired action digest) and add an explicit "investigate Renovate" item to the audit issue. Issue assigned via CODEOWNERS rotation. **Issues remaining open >30 days auto-comment-escalate** (separate scheduled step) so the audit isn't passively ignored.
  - Notes: This is the actual ownership mechanism for the quarterly audit referenced throughout the spec. The Renovate liveness check (v) catches the chicken-and-egg risk: smoke gates Renovate PRs, but smoke can't catch issues that break Renovate itself.

- [ ] **T3.9**: Implement quarantine-expiry checker in `smoke.yml`
  - File: `.github/workflows/smoke.yml` (extend), optionally `scripts/check-quarantine-expiry.sh` (new)
  - Action: Parse `tests/smoke/fixtures/assertion-bar.ts` (or its companion quarantine list) for `test.skip.fixme(..., { until: 'YYYY-MM-DD' })` annotations. Fail the build if any `until:` date is in the past AND the test is still skipped. Also fail if the in-quarantine count exceeds 3 (per Phase 4 DoD carve-out cap).
  - Notes: Without this task, the carve-out's "CI fails at expiry" guarantee in Phase 4 DoD is asserted-not-engineered.

- [ ] **T3.10**: Configure `smoke-test-deploy` deployment environment + CODEOWNERS
  - File: `.github/CODEOWNERS` (new), repo settings (manual)
  - Action: Create `.github/CODEOWNERS` covering `/.github/workflows/smoke.yml`, `/scripts/smoke.sh`, `/tests/smoke/fixtures/**`, `/docs/smoke-test-account-setup.md`, `/docs/smoke-test-account-config.yml`, `/renovate.json`, `/.github/workflows/renovate.yml` — assign to a security/devops reviewer set. In repo Settings → Environments → smoke-test-deploy, configure deployment branch policy: `refs/heads/main` no required reviewers, all other refs require approval from the CODEOWNERS reviewer set. Document this in `docs/smoke-test-account-setup.md` Operational Notes so re-setup is reproducible.

- [ ] **T3.8**: Test the rails end-to-end (integration test across phases 1, 2a, 2b.1, and 3)
  - File: N/A (verification)
  - Action: Trigger a manual `workflow_dispatch` of smoke.yml. Confirm: workflow assumes role; `all-demo` deploys; smoke runs (with zero spec files, exits 0); teardown fires; artefacts uploaded. Intentionally break one piece (e.g. wrong role ARN) and confirm failure-notification fires.
  - Notes: **T3.8 is the joining-of-tracks integration test**. It cannot pass until phase 1b's account exists, phase 2a's templates are in S3, phase 2b.1's all-demo expansion is merged, and phase 3's other tasks (T3.1-T3.7) are merged. Acceptable to defer T3.8 until those prior phases reach their target states. Until then, run scaffold-only verification (workflow lints, script env-asserts work, fixtures import cleanly) against a synthetic stand-in.

#### Phase 4 — Per-scenario smoke tests (17 PRs)

Phase 4 produces 17 PRs. Per scenario, the PR:

- Adds `tests/smoke/<scenario>.spec.ts` following the auth-mode pattern for that scenario (admin / public / SSO).
- Populates one row in `tests/smoke/fixtures/assertion-bar.ts` with `(landingAssertion, loginAssertion, featureFlow, outputsToCheck, historicalRegressionCited)`. Each row MUST cite a historical regression where one exists in memory.
- Tests locally via `./scripts/smoke.sh --project=smoke --grep <scenario>` against a deployed `all-demo` in the smoke account before opening the PR.

Priority order (flakiest / most-regressed first, per memory):
1. fixmystreet (15+ iterations of regressions)
2. planx (13 issues)
3. minute (12 issues)
4. localgov-ims (Windows EC2 with IIS quirks)
5. localgov-drupal
6. simply-readable
7. ai-contact-centre
8. paperless-ngx
9. council-chatbot
10. bops-planning
11. digital-planning-register
12. quicksight-dashboard (smoke is (a)+(d) only per auth-mode categorisation)
13. foi-redaction
14. planning-ai
15. text-to-speech
16. smart-car-park
17. all-demo (umbrella check — asserts nested-stack outputs all present)

#### Phase 5 — Pinning sweep

- [ ] **T5.1**: Resolve current digest for each own GHCR image
  - File: N/A (resolution)
  - Action: For each `:latest` site, find the current `sha-<7chars>` tag on `ghcr.io/co-cddo/ndx_try_aws_scenarios-<name>` (list via `gh api /orgs/co-cddo/packages/container/<name>/versions` or via `docker buildx imagetools inspect ghcr.io/...:latest`), then resolve the digest via `docker buildx imagetools inspect ghcr.io/...:sha-<7chars>` (or `crane digest ghcr.io/...:sha-<7chars>`); capture the `Digest:` line value. Record (image, tag, digest) tuples in a local working file consumed by T5.2-T5.6.

- [ ] **T5.2**: Replace `:latest` in fixmystreet
  - File: `cloudformation/scenarios/fixmystreet/cdk/lib/constructs/compute.ts:97`
  - Action: Replace literal `'ghcr.io/co-cddo/ndx_try_aws_scenarios-fixmystreet:latest'` with `:sha-<7chars>@sha256:<digest>`.

- [ ] **T5.3**: Replace `:latest` in planx (4 sites)
  - File: `cloudformation/scenarios/planx/cdk/lib/constructs/compute.ts:137,212,304,353`
  - Action: Replace each `${ghcrPrefix}-<service>:latest` template-string with the SHA + digest. Update `ghcrPrefix` to a constant carrying the SHA, OR refactor to a per-service constant — implementer's choice; the Renovate regex matches either form.

- [ ] **T5.4**: Replace `:latest` in localgov-drupal
  - File: `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts:275`
  - Action: Replace literal with `:sha-<7chars>@sha256:<digest>`.

- [ ] **T5.5**: Replace `:latest` in paperless-ngx (2 upstream sites)
  - File: `cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/compute.ts:165,191`
  - Action: Tika line: pin to `:<datestamp-or-major>@sha256:<digest>` per Pinning strategy "upstream rolling" row. Paperless-ngx line: pin to `:<semver>@sha256:<digest>` per "upstream pinned releases" row.

- [ ] **T5.6**: Replace `:latest` in minute (3 sites)
  - File: `cloudformation/scenarios/minute/template.yaml:1943,2325,2604`
  - Action: Replace each `"Image": "...:latest"` with `"Image": "...:sha-<7chars>@sha256:<digest>"`.

- [ ] **T5.7**: Verify zero remaining `:latest`
  - File: N/A (verification)
  - Action: `grep -rE ':latest' cloudformation/scenarios/ --include='*.yaml' --include='*.yml' --include='Dockerfile*' --include='*.ts' --include='*.json' 2>/dev/null | grep -vE 'package-lock|node_modules|cdk.out'` returns no output.

- [ ] **T5.8**: Per-pin verification (each T5.2-T5.6 PR includes this step)
  - File: each PR's description
  - Action: Before merging each per-site pin sweep, the PR author manually deploys the affected scenario (into a personal dev account or the smoke account if phase 1b complete) and verifies the new digest produces a working scenario. If the relevant smoke spec exists (phase 4 has reached it), run it against the new pin. Otherwise: deploy + browse-to-URL sanity check. Attach result to the PR. Without this, phase 5 ships pins that may break the scenario, only caught by the eventual nightly cron post-merge.

#### Phase 6 — Self-hosted Renovate adoption

- [ ] **T6.1**: Author `renovate.json`
  - File: `renovate.json` (new)
  - Action: Configure with: `osvVulnerabilityAlerts: true`; `dependencyDashboard: true` (state-persistence — see T6.2 Notes); the 6 group rules from Pinning Strategy section (scenario-`<name>`-images, npm-dev, npm-prod, composer, github-actions, security-priority); custom managers for own + upstream GHCR/dockerhub image pins (see skeleton below); weekly schedule for non-scenario groups; immediate for scenarios and security.
  - Notes: skeleton for the custom manager (Renovate `customManagers` is the current API; `regexManagers` is deprecated):
    ```json
    "customManagers": [{
      "customType": "regex",
      "fileMatch": ["cloudformation/scenarios/.*\\.(ts|yaml|yml|json)$"],
      "matchStrings": [
        "(?<depName>(?:ghcr\\.io|docker\\.io)/[a-z0-9._/-]+):(?<currentValue>[a-z0-9.\\-]+)@(?<currentDigest>sha256:[a-f0-9]+)"
      ],
      "datasourceTemplate": "docker",
      "versioningTemplate": "docker"
    }]
    ```
    This single manager matches BOTH our own GHCR images and upstream images (tika, paperless-ngx-upstream) in CDK TypeScript literals and raw CFN templates — Renovate's built-in `docker` manager does NOT cover CDK `fromRegistry()` strings, so a custom manager is mandatory for upstream digest tracking. Plus `packageRules` translating the 6 group-rules table to Renovate's `matchPackageNames` / `matchManagers` / `groupName` / `schedule` syntax.

- [ ] **T6.2**: Author `.github/workflows/renovate.yml`
  - File: `.github/workflows/renovate.yml` (new)
  - Action: Cron schedule **twice daily** (e.g. `0 6,18 * * *`) — cold-start cost is non-trivial (full repo scan + per-package resolution per run, ~2-3 min for this repo size); 4×/day adds CI minute overhead without proportional value. Plus `workflow_dispatch:` for ad-hoc runs. Uses `renovatebot/github-action` **pinned by digest** (e.g. `renovatebot/github-action@v40.x.x@sha256:<digest>`) — per the pinning strategy, no floating tag. Token: `secrets.RENOVATE_TOKEN`. Permissions: `contents: read` (Renovate writes via the PAT, not `GITHUB_TOKEN`).
  - Notes: **Renovate state mechanism**: `renovate.json` sets `dependencyDashboard: true` so state (open PRs, ignored deps, pending updates) is tracked in a single auto-maintained GH issue titled "Dependency Dashboard." This is Renovate's documented mechanism for ephemeral execution; without it, Renovate re-resolves every dependency every run and may open duplicate PRs. The dashboard issue is also the operator's discoverability surface — bookmark it.

- [ ] **T6.3**: Mint and store `RENOVATE_TOKEN`
  - File: GitHub repo secrets
  - Action: Operator mints a fine-grained PAT scoped `repo: read+write` on `co-cddo/ndx_try_aws_scenarios` only, with chosen expiration policy from runbook Operational Notes. Stored as repo secret `RENOVATE_TOKEN`.

- [ ] **T6.4**: Delete `.github/dependabot.yml`
  - File: `.github/dependabot.yml`
  - Action: Delete in the same PR as T6.1 and T6.2.

- [ ] **T6.5**: Close in-flight Dependabot PRs
  - File: GitHub PR list
  - Action: Before merging the Renovate PR, list open Dependabot PRs. Either merge them (preferred for current and safe ones) or close with comment "superseded by Renovate adoption" (re-opens via Renovate within hours).

- [ ] **T6.6**: Verify Renovate fires
  - File: N/A (verification)
  - Action: After merge, manually trigger `workflow_dispatch` on renovate.yml. Confirm at least one PR opens. Confirm smoke gates the PR (CI shows smoke run). Done = first Renovate PR has fired AND smoke has gated it.

### Acceptance Criteria

ACs are grouped by phase and follow Given/When/Then.

#### Phase 1a + 1b

- [ ] **AC1.1**: Given the runbook PR is opened, when the security/org-admin reviewer reads it, then they can identify the exact CLI commands, idempotency checks, rollback paths, and verification commands for each step without inferring from context.
- [ ] **AC1.2**: Given the runbook is merged, when an operator with org-management SSO follows it from the top, then a smoke-test account is created, placed in the correct OU, OIDC provider and deploy role exist, Bedrock models are accessible (verification step retries with exponential backoff up to 15 minutes to absorb propagation lag, then up to 3 additional 15-minute waits totalling 60 min; if STILL failing, the runbook fails and the operator manually checks the Bedrock console for terms-of-use acceptance — some Anthropic Claude variants require manual TOS click-through not exposed via CLI; operator records affected model IDs in the runbook for future operators), and `docs/smoke-test-account-config.yml` is populated with all required fields.
- [ ] **AC1.3**: Given an operator re-runs the runbook after a partial failure, when each idempotent step executes, then existing resources are detected and skipped without error.
- [ ] **AC1.4**: Given the ProtectISB role-creation check fails (deadlock), when the runbook fallback branch executes, then the account is moved to root with selective SCP attachment, the placement branch is recorded in the config file, and the runbook's verification step still passes.

#### Phase 2a + 2b

- [ ] **AC2.1**: Given a push to main touches `cloudformation/scenarios/**`, when `deploy-blueprints.yml` runs, then `s3 ls scenarios/` shows exactly 17 directories each containing `template.yaml`.
- [ ] **AC2.2**: Given a PR adds CDK code that produces a synthesized `DeletionPolicy: Retain` or `UpdateReplacePolicy: Retain` (whether via explicit `applyRemovalPolicy(RETAIN)`, an aspect, a base-class default, or an escape-hatch override) without a `Metadata.Justification` on the resource, when CI runs `cdk synth` followed by the retention lint, then the lint fails the build naming the template file and the resource logical ID.
- [ ] **AC2.3**: Given a PR adds a retention attribute with `Metadata: { Justification: "<text>" }` on the same resource, when CI runs the retention lint, then it passes.
- [ ] **AC2.4**: Given `all-demo` is deployed manually into the smoke account, when CloudFormation completes, then all 17 nested stacks reach `CREATE_COMPLETE`. **If quota errors block deploy, AC2.4 is NOT satisfied** — phase 2b is BLOCKED until quota tickets resolve (typically 5+ business days for SES production / Bedrock TPM). Phase 3 onward is gated by phase 2b's true completion. The "we filed tickets" interim state is acceptable progress reporting but NOT acceptance.

#### Phase 3

- [ ] **AC3.1**: Given a PR touches only `cloudformation/scenarios/minute/**`, when smoke.yml runs, then only the minute scenario is included in the scoped smoke run.
- [ ] **AC3.1b**: Given a PR touches any "rails" path (`scripts/smoke.sh`, `playwright.config.ts`, `.github/workflows/smoke.yml`, `tests/smoke/fixtures/**`, `cloudformation/scenarios/all-demo/template.yaml`, `docs/smoke-test-account-config.yml`, root `package.json`), when smoke.yml runs, then the FULL set of 17 scenarios is included — scoped smoke would be unsafe because rails changes affect every scenario.
- [ ] **AC3.2**: Given the nightly cron fires, when smoke.yml runs, then all 17 scenarios are tested.
- [ ] **AC3.3**: Given `tests/smoke/fixtures/cfn-outputs.ts` receives CFN Outputs named `DrupalAdminPassword`, `AdminCreds`, `BootstrapKey`, `DBConnectionString`, OR any Output carrying `Metadata: { Sensitive: true }`, when its `toString()` or `JSON.stringify` is called, then the value does NOT appear in the output; it only appears via the explicit `sensitiveValue()` accessor.
- [ ] **AC3.4**: Given a fork PR is opened with a malicious workflow attempting to assume the deploy role, when the OIDC trust policy evaluates the request, then assume-role is denied because `repository_owner` claim doesn't match `co-cddo`.
- [ ] **AC3.5**: Given a nightly cron fails, when smoke.yml's failure step runs, then either a GH issue tagged `smoke-failed` is opened OR a webhook is fired (per configuration).
- [ ] **AC3.6**: Given the smoke OU's SCP attachments drift (e.g. an SCP is detached upstream), when nightly smoke.yml runs the SCP drift check on the first detection, then a GH issue tagged `scp-drift` is opened and the build does NOT fail (fail-soft).
- [ ] **AC3.6b**: Given an `scp-drift` issue has accumulated 7 or more timestamped comments (one per consecutive nightly run that still detected the drift), when the next nightly smoke runs the drift check, then the workflow flips to **fail-build** and stays failed until the issue is closed. **State persistence mechanism**: the GH issue IS the counter — each nightly detection appends a timestamped comment to the open issue (no separate state store; survives the stateless workflow). Closing the issue resets.
- [ ] **AC3.7**: Given a smoke run fails mid-way, when teardown executes (`if: always()`), then `aws cloudformation delete-stack` is called on every scoped stack with up to 3 retry attempts × 60s between attempts before declaring `DELETE_FAILED`.
- [ ] **AC3.7b**: Given a previous smoke run left `all-demo` in `DELETE_FAILED` or any `*_IN_PROGRESS` state, when the next smoke run starts the pre-deploy state check, then deploy is aborted, a `stranded-stack` issue is opened with the stack name and last events, and the run fails fast (does NOT pile on top of half-deleted state).
- [ ] **AC3.7c**: Given a teardown attempt fails after retries, when the workflow reaches its final step, then stack events are written to the artefact bundle and a `stranded-stack` issue is opened or updated with the blocker resource type (ENI, S3 contents, retained-by-default resource) for human triage.
- [ ] **AC3.8**: Given a PR touches only paths outside the trigger set (e.g. `docs/**`, `README.md`), when smoke.yml's path filter evaluates, then NO smoke run fires.
- [ ] **AC3.9**: Given a smoke run fails, when the workflow reaches the artefact-upload step, then traces + screenshots + CFN events + image SHAs + CloudWatch tails are uploaded BEFORE the teardown step runs — so live-stack state is captured before deletion.
- [ ] **AC3.10**: Given a PR carries the `smoke-override-emergency` label AND has approval from a CODEOWNERS reviewer, when smoke fails, then merge is permitted; AND a reminder issue is automatically opened at 48h with label `smoke-override-followup`.
- [ ] **AC3.11**: Given a contributor opens a PR that modifies `.github/workflows/smoke.yml`, `scripts/smoke.sh`, or `tests/smoke/fixtures/**`, when the workflow attempts to assume the deploy role, then the run halts at the `smoke-test-deploy` environment gate awaiting CODEOWNERS-set reviewer approval; the deploy job does not start (and therefore the OIDC token is not consumed) until approval is granted.
- [ ] **AC3.12**: Given a smoke test calls `fillPassword(page, ..., sensitiveValue())` for a login form, when the resulting form-submission request is captured in the Playwright trace, then the trace request body contains `REDACTED-<hash>` in place of the cleartext password value.
- [ ] **AC3.13**: Given a stranded stack in `DELETE_FAILED` or any `*_IN_PROGRESS` state exists from a prior run, when the next smoke run pre-deploy state check executes, then auto-cleanup is attempted (`continue-update-rollback` or retry `delete-stack`); if that fails, the run proceeds against a **unique recovery stack name** (`all-demo-recovery-<timestamp>`) so subsequent runs are NOT blocked.
- [ ] **AC3.14**: Given a quarantine-skipped test's `until:` date has passed, when smoke.yml runs the quarantine-expiry checker (T3.9), then the build fails with a message naming the expired test.
- [ ] **AC3.15**: Given the carve-out cap (≤3 concurrent `test.skip.fixme`) is exceeded, when smoke.yml runs the quarantine-expiry checker, then the build fails with a message listing all currently-skipped tests.

#### Phase 4

- [ ] **AC4.1**: Given a scenario's smoke spec file is landed, when smoke runs locally via `./scripts/smoke.sh --grep <scenario>` against a deployed `all-demo`, then the spec passes (landing assertion + login if applicable + bug-informed feature flow + CFN Outputs check).
- [ ] **AC4.2**: Given a scenario's smoke spec file is landed, when `tests/smoke/fixtures/assertion-bar.ts` is read, then that scenario has exactly one populated `AssertionBarRow` citing a historical regression.
- [ ] **AC4.3**: Given all 17 scenarios have landed smoke specs, when `tests/smoke/fixtures/assertion-bar.ts` is read, then it contains 17 rows (one per scenario). **Done = 100%, not 80%**.

#### Phase 5

- [ ] **AC5.1**: Given Phase 5 has merged, when `grep -rE ':latest' cloudformation/scenarios/` runs (excluding package-lock and cdk.out), then no results are returned.
- [ ] **AC5.2**: Given a scenario template references a pinned image, when the regex `:sha-([a-f0-9]+)@sha256:([a-f0-9]+)` (own images) or `:<semver-or-tag>@sha256:([a-f0-9]+)` (upstream) is applied, then every reference matches one of the two forms.

#### Phase 6

- [ ] **AC6.1**: Given Phase 6 has merged, when `.github/dependabot.yml` is read, then the file does not exist.
- [ ] **AC6.2**: Given Renovate's first scheduled run completes, when the PR list is inspected, then at least one PR has been opened by Renovate and tagged with the appropriate group label.
- [ ] **AC6.3**: Given Renovate opens a PR that bumps an own-image digest, when smoke.yml runs on that PR, then the smoke gate either passes or fails based on the new image's behaviour — Renovate's merge is contingent on the gate.
- [ ] **AC6.4**: Given a known-vulnerable upstream version is released, when Renovate's `osvVulnerabilityAlerts` evaluates the dependency, then a PR is opened in the `security-priority` group (not batched with other updates).
- [ ] **AC6.5**: Given an upstream image (e.g. `docker.io/apache/tika`, `ghcr.io/paperless-ngx/paperless-ngx`) publishes a new digest for its currently-tracked tag, when Renovate's next run completes, then Renovate opens a PR updating the digest in the relevant `compute.ts` file. Verified by intentionally pinning an out-of-date digest before Renovate's next scheduled run.

## Additional Context

### Dependencies

**Org-management account access for the runbook operator** — phase 1 requires a human operator with active SSO into the org-management account, with permissions for `organizations:CreateAccount`, `organizations:CreateOrganizationalUnit`, `organizations:MoveAccount`, and `organizations:AttachPolicy` (fallback branch). The operator must also be able to assume `OrganizationAccountAccessRole` into the newly-vended smoke-test account for the OIDC + role creation steps. No CDK / no GH-Actions trust into org-management is needed.

**ISB SCP IDs (for the fallback branch only)** — if the runbook's primary placement (child of sandboxOu) fails the ProtectISB role-creation check, the fallback explicitly attaches Restrictions + LimitRegions + AwsNukeSupportedServices to the smoke-test account. The runbook captures these SCP IDs once via `aws organizations list-policies-for-target --target-id <sandboxOu-id>` and includes the `aws organizations attach-policy` calls inline.

**`sandboxOu` lookup** — runbook step. `aws organizations list-roots` then `list-organizational-units-for-parent` until the OU containing `Active`/`Available`/etc. is found. ID recorded in `docs/smoke-test-account-config.yml`.

**Renovate token** — phase 6 needs a fine-grained PAT with scope `repo: read+write` on `co-cddo/ndx_try_aws_scenarios` only. Stored in the repo's GH Actions secrets as `RENOVATE_TOKEN`. Requires a human with org-admin to mint.

**Smoke account secrets** — phase 4 smoke tests for some scenarios need credentials (e.g. `DrupalAdminPassword`). All come from CFN Outputs of the deployed stack — no external secrets vault required for smoke. The deploy role created in the runbook must include `cloudformation:DescribeStacks` permission inside the smoke-test account.

### Testing Strategy

This spec **is** the testing strategy for every other scenario in the repo. Step 3 will detail the per-scenario assertion bar; the headline shape is: each scenario gets one Playwright file under `tests/smoke/<scenario>.spec.ts` that asserts (a) the CFN-output landing URL serves a known-good response (status + at-minimum-one body assertion specific to the scenario), (b) the login codepath for that scenario completes (where applicable — see categorisation below), (c) one bug-informed feature flow executes end-to-end, (d) a small set of CFN Outputs are present and shaped correctly. The assertion bar table in Step 3 enumerates (a)–(d) per scenario with a citation to the historical regression that informed (c).

#### Scenario auth-mode categorisation (drives the shape of (b))

| Auth mode | Scenarios | Smoke (b) shape |
|---|---|---|
| **Admin login (form-based)** | ai-contact-centre, fixmystreet, localgov-drupal, localgov-ims, minute (basic auth), paperless-ngx, planx, simply-readable, digital-planning-register, bops-planning | Test submits credentials from CFN outputs (e.g. `AdminUsername`/`AdminPassword`), asserts post-auth indicator (URL or DOM) |
| **No login (public Lambda FunctionURL or public page)** | foi-redaction, planning-ai, text-to-speech, smart-car-park, council-chatbot | (b) is N/A — assertion bar row omits the login row; (c) feature flow is invoked directly on the public URL |
| **SSO / external auth** | quicksight-dashboard | (b) is skipped for smoke; landing assertion asserts the SSO redirect URL is correct (we don't drive the SSO IdP in smoke); (c) is also skipped — quicksight smoke is "deploys cleanly + outputs present" only |

This categorisation locks the structural variance of the 17 spec rows so Phase 4 PRs don't all re-derive it.

**QuickSight clarification**: quicksight-dashboard STILL produces a `tests/smoke/quicksight-dashboard.spec.ts` in phase 4 — it just asserts only (a) the deployed URL responds and (d) the CFN Outputs are present and shaped correctly. (b) and (c) are explicitly skipped with an in-file comment referencing this categorisation, so the file isn't accidentally treated as "partial work" by reviewers.

#### Cost trade-off (explicit)

We accept unbounded smoke-account cost as a known risk. There is no automated budget alarm. Mitigation is twofold: (1) the retention-policy lint prevents orphan-creating templates from merging, so most cleanup is automatic at deploy-time; (2) a quarterly manual spend audit (added to the runbook's "operational notes" section) catches drift.

**Per-run cost is non-trivial.** Each full smoke run pays the full deploy cost of 17 scenarios (VPC + NAT GW + RDS/Aurora + ECS + Bedrock invocations + EFS + Lambda warm-ups, etc.) plus run-duration ECS task minutes plus teardown latency. Nightly cron + every PR full-smoke = several full-deploy cycles per day. If this becomes a meaningful spend line, the revisit options (out of current scope) are: (a) share infrastructure across scenarios that allow it (e.g. one VPC, one NAT GW, multiple scenario tenants); (b) move to a longer-lived deployment with state-reset between runs (snapshot/restore or per-test cleanup endpoints in each scenario); (c) batch smoke into a single weekly deep run plus per-PR scoped runs only. Each option trades off operational complexity for cost.

#### Known smoke limitations

Smoke is the **deployability + first-feature gate**, not the only test we need. It will NOT catch:

- **Silent data corruption** — e.g. the S3Files versioning gotcha where deploy succeeds and the bug only shows up when files start vanishing. Mitigation: data-integrity assertions in (c) where feasible.
- **Background-worker failures** — e.g. Celery / queue workers that fail silently while the web tier remains green. Mitigation: where the feature flow depends on async work (FixMyStreet email send, Minute transcription, PlanX cron), the assertion must wait for the async output, not just the submit response.
- **Performance regressions** — smoke checks correctness, not latency. Out of scope for this spec.
- **Header-only behaviour** — e.g. the PlanX Caddy elimination breaking header forwarding. Mitigation: feature flows that depend on auth headers should hit an endpoint that *uses* the header, not just one that *issues* it.
- **Auth flows not exercised by the chosen feature** — by definition, one feature per scenario leaves other auth paths untested. Mitigation: the deepening-cadence rule (every escaped regression deepens the bar).
- **Cross-scenario interactions** — `all-demo` deploys 17 scenarios into one account but smoke tests them independently; cross-scenario contention (shared quotas, cross-VPC leakage) is not covered. Mitigation: rely on the deploy itself surfacing quota errors.
- **24h detection window for non-PR regressions** — smoke catches PR-introduced regressions immediately, but regressions that arrive *outside* a PR (AWS-side API deprecations, upstream image silent re-tags before Renovate notices, certificate expiries, smoke-account config drift) are only caught on the next nightly run. Worst-case latency-to-detection is ~24 hours. Mitigation: SCP-drift check fires nightly; the runbook's quarterly audit catches longer-cycle drift. Anything that needs sub-24h detection is out of scope and would require monitoring, not testing.

Reading this list before claiming "green smoke = no regressions" is the spec's honest expectation-setter for the team and stakeholders.

#### Smoke gate override path

The smoke gate is the merge contract for everything that touches `cloudformation/scenarios/**`, scenario images, or the `all-demo` template. **In a true emergency** (production-down, data corruption in flight, user-visible outage), the gate can be overridden via:

1. Apply label `smoke-override-emergency` to the PR (requires manual approval from a security/oncall reviewer; CODEOWNERS or branch protection enforces this).
2. Merge with the override.
3. **Mandatory 48h follow-up PR** that either re-enables smoke for that scenario OR documents the explicit decision to defer (with a tracking issue). CI emits a reminder issue at 48h that ages until resolved.

This path exists so that "smoke is broken" never becomes a reason to disable smoke at the workflow level. Override is per-PR, with a forcing function for follow-up; there is no global smoke-disable mechanism.

### Notes

**High-risk items (carried forward from pre-mortem analysis):**

- **Phase 1b is the irreversible-blast-radius phase.** Account creation is functionally hard to undo (90-day closure window per AWS). Mitigations: runbook is reviewed pre-execution (1a); operator has explicit rollback for each destructive step; idempotency lets a partial run be re-run safely.
- **ProtectISB role-creation deadlock** is the highest-uncertainty technical risk in phase 1. The runbook MUST execute the check-then-fallback branch interactively; do not assume the primary placement works.
- **Quota cliffs at phase 3 nightly cron** if phase 2b's real-deploy verification is skipped. The DoD calls this out explicitly.
- **Renovate firehose** if grouping rules are not implemented exactly as committed in the Pinning Strategy table. The 6 group rules are load-bearing.
- **Secret leakage via CFN Outputs** — the `cfn-outputs.ts` redaction contract is the only defence between `DrupalAdminPassword` and a 30-day-retained GH Actions artefact. Phase 3 review must verify the redaction works.

**Known limitations (carried forward from Step 1 Critique pass):**

- Smoke pack catches deployability + first-feature regressions; subtler categories (silent data corruption, background-worker failures, performance, header-only behaviour, unexercised auth paths, cross-scenario contention, 24h non-PR detection window) are documented in Testing Strategy → Known smoke limitations. The deepening-cadence rule is the long-run mitigation.

**Future considerations (out of scope for this spec but worth tracking):**

- If org-management changes become frequent or auditability becomes critical, port the runbook to a CDK app (ADR-3 acknowledges this).
- Bedrock model access in `expected_scps`-like check (currently SCP drift only; model access could regress separately).
- Owner / assignment table for Phase 4 (17 PRs across multiple authors) — assigned at scheduling time, not in this spec.
- Cost backstop beyond quarterly audit (e.g. Budgets alarm) — deferred per user direction; revisit if smoke-account spend becomes meaningful.
- Visual-regression integration into the smoke pack (currently only the portal site has pixel-diff testing) — explicitly out of scope.

**Repo facts:**

- Hub account is `568672915267`; existing OIDC + IAM role + StackSets pattern lives in `cloudformation/isb-hub/`.
- Existing related spec: `_bmad-output/implementation-artifacts/tech-spec-isb-remaining-scenarios-ci.md` (blueprint S3 sync CI). This spec rides on top of that infrastructure but does NOT modify the deploy-blueprints workflow itself other than the additions in Phase 2a/2b.
- Global CLAUDE.md constraint: us-east-1 + us-west-2 only across all NDX:Try work; this spec deliberately chooses us-east-1 only.
