# ADR 0001 — Per-scenario CI lease trust chain

Status: Accepted (2026-05-21)
Decision-makers: Chris Nesbitt-Smith, NDX:Try team
Supersedes: the all-demo umbrella + persistent smoke account model (PR #358 / ADR-3 from the older tech spec marked superseded in `_bmad-output/implementation-artifacts/tech-spec-scenario-regression-smoke-pack.md`).

## Context

Each NDX:Try scenario lives as a CloudFormation template under `cloudformation/scenarios/<name>/`. CI needs to deploy that template into a fresh AWS account, run a Playwright smoke spec against the live stack, and tear it down — fast enough to gate PRs.

The previous model (one persistent "smoke" account, one umbrella stack that nested all scenarios) failed for reasons documented in PR #358. The replacement claims one ephemeral Innovation Sandbox (ISB) lease per CI run, deploys exactly one scenario into the leased pool account, and releases the lease at the end. To make this work in GitHub Actions we needed an authentication chain that:

1. Lets a PR-triggered workflow (any branch, any author with a CODEOWNERS approval) talk to the ISB lease API.
2. Lets that workflow assume a role inside whichever pool account it just leased.
3. Survives ISB's pool-account churn (accounts are nuked between leases).
4. Doesn't compromise the existing main-only `isb-hub-github-actions-deploy` role used by `deploy-blueprints.yml`.
5. Plays nicely with SCP `p-tyb1wjxv`, which denies all actions inside pool accounts except for principals matching `arn:aws:iam::*:role/InnovationSandbox-{namespace}*`.

## Decision

A two-role chain plus a separate StackSet that provisions the in-lease role.

```
GitHub Actions runner
  └─ aws-actions/configure-aws-credentials (OIDC)
       └─ assumes role in hub 568672915267:
            isb-hub-github-actions-ci-lease (new, sibling of -deploy)
            trust: token.actions.githubusercontent.com,
                   sub = repo:co-cddo/ndx_try_aws_scenarios:*
            permissions:
              - secretsmanager:GetSecretValue on
                arn:aws:secretsmanager:us-west-2:568672915267:secret:
                  /InnovationSandbox/ndx/Auth/JwtSecret*
              - sts:AssumeRole on
                arn:aws:iam::*:role/InnovationSandbox-ndx-CIDeployRole
       └─ Reads JWT secret → signs ISB API request → POST /leases
       └─ Receives awsAccountId for the leased pool account
       └─ Assumes the in-lease role:
            arn:aws:iam::<leasedAcct>:role/InnovationSandbox-ndx-CIDeployRole
            trust: arn:aws:iam::568672915267:role/isb-hub-github-actions-ci-lease
            permissions: CloudFormation + the AWS services scenarios use
       └─ aws cloudformation deploy → playwright test → release lease
```

### Gating PR-triggered access

The wide subject claim (`repo:co-cddo/ndx_try_aws_scenarios:*`) means any branch can assume the hub role *in principle*. The actual approval is enforced one layer up via the `smoke-test-deploy` GitHub environment, declared by every caller workflow under `.github/workflows/scenario-*.yml`:

```yaml
environment: smoke-test-deploy
```

That environment's CODEOWNERS-required reviewer + branch policy means a human signs off before the OIDC role is assumed for a PR. The environment is named `smoke-test-deploy` for continuity with the old model; it would be confusing to rename it after the demolition.

### Why an additive StackSet, not an upstream edit

The natural home for `InnovationSandbox-ndx-CIDeployRole` would be the upstream `Isb-{namespace}-SandboxAccountResources` StackSet (defined at `~/httpdocs/innovation-sandbox-on-aws/source/infrastructure/lib/isb-account-pool-resources.ts:338-375`). It's already SERVICE_MANAGED, already targets the sandbox-OU parent, already auto-deploys to every pool account on entry, and is already what creates the existing `InnovationSandbox-ndx-SandboxAccountRole`.

But that's `aws-solutions/innovation-sandbox-on-aws` — a vendored AWS Solutions Library project we don't own. Editing it would mean either maintaining a fork or upstreaming a PR (slow, may not be accepted, drifts on every upstream release).

Instead, we deploy our own SERVICE_MANAGED StackSet (`Isb-ndx-CIDeployRole`) mirroring the upstream pattern. It lives in `cloudformation/isb-hub-orgmgmt/ci-deploy-role-stackset/template.yaml`, **deployed to the org-management account** (NOT the hub). SERVICE_MANAGED StackSets with `AutoDeployment` need an org-management-account context to fire on OU events; the hub's existing `ndx-try-*` StackSets are SELF_MANAGED for a different reason (they don't auto-deploy — ISB provisions instances on demand).

### Why the role survives lease churn

aws-nuke runs between leases and is configured (`~/httpdocs/innovation-sandbox-on-aws/source/infrastructure/lib/components/config/nuke-config.yaml:67-79`) to preserve only a short list of IAM roles: the nuke executor itself, `OrganizationAccountAccessRole`, `stacksets-exec-*`, `AWSReservedSSO_*`, `aws-controltower-*`. Neither `InnovationSandbox-ndx-SandboxAccountRole` nor our new `InnovationSandbox-ndx-CIDeployRole` is in that list — so both get **nuked**.

This is fine. When a pool account moves out of CleanUp and re-enters the sandbox-OU for its next lease, the SERVICE_MANAGED StackSets with `autoDeployment.enabled` re-deploy their instances to that account. The role is recreated before the next lease activates. The upstream confirms this works in practice for `SandboxAccountRole`; we get the same behaviour for free.

## Consequences

**Positive:**
- The wide-trust hub OIDC role has exactly two permissions: read one secret, assume one role-name pattern. Anything else is gated either at the workflow layer (environment approval) or at the in-lease level (SCP + role permissions).
- The in-lease role's name starts with `InnovationSandbox-ndx-` so it's exempt from SCP `p-tyb1wjxv` without further plumbing.
- Pool capacity is ~1,300 accounts (`ou-2laj-oihxgbtr`), effectively unbounded for our needs; no global `concurrency:` ceiling is necessary.
- The replacement model can be rolled out incrementally — Tier 1 callers can land before all 16 scenarios are migrated.

**Negative:**
- Two deploy commands now own different parts of the auth chain: `cdk deploy` of the hub (for the OIDC role + the existing `ndx-try-*` StackSets) and `aws cloudformation deploy` of the orgmgmt template (for the CIDeployRole StackSet). Documented in `cloudformation/isb-hub-orgmgmt/README.md` and PR descriptions.
- The CIDeployRole's permissions are deliberately broad (modelled on the existing `isb-deployer-sandbox-role` StackSet template, proven against the SCP). Tightening per-scenario is a follow-up; do not get blocked on it.
- ~1,300 stack-instance deployments fire when the StackSet's template changes. SOFT_FAILURE_TOLERANCE + 100% MaxConcurrentPercentage keeps this to ~10–20 min wallclock, but template edits are not free.

## Verification

- `aws cloudformation describe-stack-set --stack-set-name Isb-ndx-CIDeployRole --call-as DELEGATED_ADMIN --region us-west-2 --profile NDX/orgManagement` returns the StackSet.
- After the StackSet provisions, `aws iam get-role --role-name InnovationSandbox-ndx-CIDeployRole --profile NDX/SandboxAdmin` from a freshly-leased account returns the role.
- `python3 scripts/isb/ci_lease.py acquire --template empty-sandbox --user-email "$USER@$(hostname -f)"` from a local checkout (with `NDX/InnovationSandboxHub` credentials) provisions a lease and prints `account_id` and `lease_id`.
- The `Scenario / council-chatbot` workflow on a PR touching `cloudformation/scenarios/council-chatbot/template.yaml` runs end-to-end green in <25 min and the lease terminates.

## References

- Plan: `.claude/plans/rosy-sparking-narwhal.md`
- Demolition PR: #358 (`chore/remove-all-demo-smoke`)
- Hub CDK: `cloudformation/isb-hub/lib/isb-hub-stack.ts:130-145` (existing deploy role) + new CI-lease role at the end of the same file.
- Org-management template: `cloudformation/isb-hub-orgmgmt/ci-deploy-role-stackset/template.yaml`.
- Helper: `scripts/isb/ci_lease.py`, `scripts/isb/README.md`.
- Reusable CI workflow: `.github/workflows/scenario-ci.yml`.
- Janitor: `.github/workflows/isb-lease-janitor.yml`.
- ISB API client reference: `~/httpdocs/innovation-sandbox-on-aws-utils/isb_common.py` @ commit `13fc703`.
- Upstream StackSet pattern: `~/httpdocs/innovation-sandbox-on-aws/source/infrastructure/lib/isb-account-pool-resources.ts:338-375`.
- aws-nuke exclusions: `~/httpdocs/innovation-sandbox-on-aws/source/infrastructure/lib/components/config/nuke-config.yaml:67-79`.
- SCP `p-tyb1wjxv` source: `~/httpdocs/innovation-sandbox-on-aws/source/infrastructure/lib/components/service-control-policies/isb-deny-all-non-control-plane-actions.json`.
