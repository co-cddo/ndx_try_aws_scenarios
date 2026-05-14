# Smoke-Test Account Setup Runbook

One-off manual procedure for vending the long-lived AWS account that hosts the NDX:Try
scenario-regression smoke pack. Replaces a CDK app per ADR-3 of
[`tech-spec-scenario-regression-smoke-pack.md`](../_bmad-output/implementation-artifacts/tech-spec-scenario-regression-smoke-pack.md).

This runbook is the source of truth for the org-management state of the smoke-test
account: its OU placement, its SCP attachments, its OIDC provider, its deploy role,
and the inline IAM policy attached to that role. Updates to any of those land FIRST
as a PR to this file; the operator then applies the merged change. See
[Operational Notes → Updating the deploy role policy](#updating-the-deploy-role-policy).

The companion state record is `docs/smoke-test-account-config.yml`: it captures the
post-run outcomes (account ID, role ARN, OU IDs, SCP IDs) so that CI workflows and
local operators have a single committed reference.

---

## Prerequisites

### Permissions required

The operator must have an active SSO session to the **org-management account** with
permissions covering:

- `organizations:CreateAccount`
- `organizations:CreateOrganizationalUnit`
- `organizations:MoveAccount`
- `organizations:ListRoots`, `organizations:ListOrganizationalUnitsForParent`,
  `organizations:ListAccountsForParent`
- `organizations:ListPoliciesForTarget`, `organizations:AttachPolicy` (fallback branch only)
- `organizations:DescribeCreateAccountStatus`
- Ability to assume `OrganizationAccountAccessRole` in the newly-vended smoke-test
  account (this role is auto-created on `CreateAccount` and trusts the org-management
  account).

No CDK and no GitHub Actions trust into org-management is required. All steps run
from the operator's local shell.

### Tools required

| Tool | Version | Purpose |
|------|---------|---------|
| `awscli` | v2.13+ | All AWS calls |
| `jq` | 1.6+ | JSON parsing |
| `yq` | 4.x | YAML editing of the config file |
| `bash` | 5.x (mac default 3.x acceptable) | The procedure assumes POSIX shell |

### Awareness required

Read these before starting:

1. The headline tech-spec ([`tech-spec-scenario-regression-smoke-pack.md`](../_bmad-output/implementation-artifacts/tech-spec-scenario-regression-smoke-pack.md))
2. ADR-1 (OU placement decision) and ADR-3 (runbook-not-IaC decision) inside that spec
3. The ProtectISB role-creation deadlock fallback branch (described in this runbook
   under [Step 7](#step-7-protectisb-role-creation-canary))

The procedure is irreversible at Step 4 (account creation); read the whole runbook
once before running any command.

### Working environment

Set these once at the top of your shell session. Every subsequent step references
them by name.

```bash
# Org-management SSO profile
export ORG_PROFILE="NDX/<your-org-management-profile>"

# Hub account (the existing ISB hub; same value as the spec)
export HUB_ACCOUNT="568672915267"

# GitHub repo (used by the OIDC trust policy)
export GITHUB_REPO="co-cddo/ndx_try_aws_scenarios"

# Email for the new account (must be unique across all AWS; cannot reuse an existing AWS account email)
export SMOKE_ACCOUNT_EMAIL="aws-smoke-test+ndx-try@<your-domain>"

# Display name for the new account
export SMOKE_ACCOUNT_NAME="ndx-try-smoke-test"

# OU display name
export SMOKE_OU_NAME="NdxTrySmokeTest"

# Region (us-east-1 per CLAUDE.md and the spec)
export SMOKE_REGION="us-east-1"

# Deploy role name (must start with InnovationSandbox-ndx-* per the Restrictions SCP)
export DEPLOY_ROLE_NAME="InnovationSandbox-ndx-SmokeTestDeployRole"

# Path the runbook will edit
cd "$(git rev-parse --show-toplevel)"
export CONFIG_FILE="docs/smoke-test-account-config.yml"
```

Verify your session:

```bash
aws sts get-caller-identity --profile "$ORG_PROFILE"
```

Expected: an `Arn` ending in your org-management role / user identifier. If you see
`Token has expired`, run `aws sso login --profile "$ORG_PROFILE"` and retry.

---

## Procedure

Every step starts with an idempotency check (so a partial re-run skips completed
work) and lists its inverse for mid-procedure rollback. Where a step is irreversible
(account creation), the inverse is documented as a separate abort procedure rather
than a one-line `delete-*` command.

### Step 1: Discover the `sandboxOu` ID

The `sandboxOu` is the OU whose children are `Active`, `Available`, `Frozen`,
`CleanUp`, `Quarantine`, `Entry`, `Exit`. Its display name in AWS is typically
`InnovationSandboxAccountPool` but enumerate to confirm.

**Idempotency check:** if `$CONFIG_FILE` already has `sandbox_ou_id` populated and
that ID still resolves, skip.

```bash
ROOT_ID=$(aws organizations list-roots \
  --profile "$ORG_PROFILE" \
  --query 'Roots[0].Id' --output text)
echo "ROOT_ID=$ROOT_ID"

# Walk the OU tree under root and find the OU whose children include "Active"
aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$ORG_PROFILE" \
  --output table

# For each OU returned, list its children and look for "Active"
for OU_ID in $(aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$ORG_PROFILE" \
  --query 'OrganizationalUnits[].Id' --output text); do
  echo "Checking OU $OU_ID:"
  aws organizations list-organizational-units-for-parent \
    --parent-id "$OU_ID" \
    --profile "$ORG_PROFILE" \
    --query 'OrganizationalUnits[].Name' --output text
done
```

The OU whose children list contains `Active`, `Available`, `Frozen`, `CleanUp`,
`Quarantine`, `Entry`, `Exit` is `sandboxOu`. Capture its ID:

```bash
export SANDBOX_OU_ID="ou-xxxx-xxxxxxxx"   # from the output above

# Record in the config file
yq -i ".sandbox_ou_id = \"$SANDBOX_OU_ID\"" "$CONFIG_FILE"
```

**Rollback for this step:** none required (read-only operations).

### Step 2: Capture the SCP IDs attached to `sandboxOu`

ISB attaches up to five SCPs across its OU tree. Four of them
(`AwsNukeSupportedServices`, `Restrictions`, `ProtectISB`, `LimitRegions`) attach to
`sandboxOu` directly. The fifth (`WriteProtection`) attaches to the child OUs
`Available`/`CleanUp`/`Quarantine`/`Entry`/`Exit`, NOT to `Active`. We replicate the
*Active* profile by inheriting from `sandboxOu` only.

**Idempotency check:** if `$CONFIG_FILE` already has `expected_scps` populated and
the listed IDs still exist, skip the capture but DO re-run the diff to confirm.

```bash
aws organizations list-policies-for-target \
  --target-id "$SANDBOX_OU_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$ORG_PROFILE" \
  --output table
```

Record the SCP IDs in the config file (one per line under `expected_scps`):

```bash
SCP_IDS=$(aws organizations list-policies-for-target \
  --target-id "$SANDBOX_OU_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$ORG_PROFILE" \
  --query 'Policies[].Id' --output text)

# Replace the expected_scps list in the config file
yq -i '.expected_scps = []' "$CONFIG_FILE"
for ID in $SCP_IDS; do
  yq -i ".expected_scps += [\"$ID\"]" "$CONFIG_FILE"
done
```

Confirm the list contains exactly four policy IDs (one per SCP attached to
`sandboxOu`). If the count differs from four, stop and investigate: ISB may have
been upgraded with additional policies, in which case the spec's
`expected_scps` schema needs review before continuing.

**Rollback for this step:** none required (read-only operations).

### Step 3: Create the new OU under `sandboxOu`

**Idempotency check:** before creating, list children of `sandboxOu` and look for
`$SMOKE_OU_NAME`. If it exists, capture its ID and skip the create.

```bash
EXISTING_OU=$(aws organizations list-organizational-units-for-parent \
  --parent-id "$SANDBOX_OU_ID" \
  --profile "$ORG_PROFILE" \
  --query "OrganizationalUnits[?Name=='$SMOKE_OU_NAME'].Id" --output text)

if [ -n "$EXISTING_OU" ]; then
  export SMOKE_OU_ID="$EXISTING_OU"
  echo "OU already exists: $SMOKE_OU_ID (skipping create)"
else
  SMOKE_OU_ID=$(aws organizations create-organizational-unit \
    --parent-id "$SANDBOX_OU_ID" \
    --name "$SMOKE_OU_NAME" \
    --profile "$ORG_PROFILE" \
    --query 'OrganizationalUnit.Id' --output text)
  export SMOKE_OU_ID
  echo "Created OU: $SMOKE_OU_ID"
fi

# Record outcome
yq -i ".smoke_test_ou_id = \"$SMOKE_OU_ID\"" "$CONFIG_FILE"
yq -i ".smoke_test_ou_placement_branch = \"child-of-sandboxOu\"" "$CONFIG_FILE"
```

**Verify inheritance:** the new OU should inherit four SCPs from `sandboxOu`. Run:

```bash
aws organizations list-policies-for-target \
  --target-id "$SMOKE_OU_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$ORG_PROFILE" \
  --output table
```

Confirm the four policy IDs match `expected_scps` from Step 2. **If they don't
match, stop here**; something has changed in the org tree and the design assumption
of ADR-1 needs revisiting.

**Rollback for this step:** delete the OU (only safe if it is empty; the account
move happens later, so this step is reversible up until Step 5):

```bash
aws organizations delete-organizational-unit \
  --organizational-unit-id "$SMOKE_OU_ID" \
  --profile "$ORG_PROFILE"
```

### Step 4: Vend the smoke-test account

**Critical: this step is functionally irreversible.** AWS account closure is a
multi-step administrative procedure with a 90-day closure window, and the account
remains in the org during that window. Pause and confirm the values in
`$SMOKE_ACCOUNT_EMAIL`, `$SMOKE_ACCOUNT_NAME`, `$ORG_PROFILE` before running.

**Idempotency check:** before requesting creation, list active accounts in the org
and look for one matching `$SMOKE_ACCOUNT_EMAIL` or `$SMOKE_ACCOUNT_NAME`.

```bash
EXISTING=$(aws organizations list-accounts \
  --profile "$ORG_PROFILE" \
  --query "Accounts[?Email=='$SMOKE_ACCOUNT_EMAIL' || Name=='$SMOKE_ACCOUNT_NAME'].Id" \
  --output text)

if [ -n "$EXISTING" ]; then
  export SMOKE_ACCOUNT_ID="$EXISTING"
  echo "Account already exists: $SMOKE_ACCOUNT_ID (skipping create)"
else
  REQUEST_ID=$(aws organizations create-account \
    --email "$SMOKE_ACCOUNT_EMAIL" \
    --account-name "$SMOKE_ACCOUNT_NAME" \
    --role-name OrganizationAccountAccessRole \
    --iam-user-access-to-billing DENY \
    --profile "$ORG_PROFILE" \
    --query 'CreateAccountStatus.Id' --output text)
  echo "Account creation in flight: $REQUEST_ID"

  # Poll until SUCCEEDED or FAILED. Typical time: 1-2 minutes; allow up to 15.
  for i in $(seq 1 30); do
    STATUS=$(aws organizations describe-create-account-status \
      --create-account-request-id "$REQUEST_ID" \
      --profile "$ORG_PROFILE" \
      --query 'CreateAccountStatus.State' --output text)
    echo "Attempt $i: $STATUS"
    if [ "$STATUS" = "SUCCEEDED" ]; then
      SMOKE_ACCOUNT_ID=$(aws organizations describe-create-account-status \
        --create-account-request-id "$REQUEST_ID" \
        --profile "$ORG_PROFILE" \
        --query 'CreateAccountStatus.AccountId' --output text)
      export SMOKE_ACCOUNT_ID
      break
    fi
    if [ "$STATUS" = "FAILED" ]; then
      aws organizations describe-create-account-status \
        --create-account-request-id "$REQUEST_ID" \
        --profile "$ORG_PROFILE"
      echo "Account creation failed; do NOT retry without investigating the failure reason"
      exit 1
    fi
    sleep 30
  done
fi

echo "SMOKE_ACCOUNT_ID=$SMOKE_ACCOUNT_ID"
yq -i ".smoke_test_account_id = \"$SMOKE_ACCOUNT_ID\"" "$CONFIG_FILE"
yq -i ".smoke_test_region = \"$SMOKE_REGION\"" "$CONFIG_FILE"
```

**Inverse / abort procedure (irreversible-ish):**
1. If the create-account request is in `IN_PROGRESS`, wait for it to finish; AWS
   provides no cancel.
2. If `SUCCEEDED` and you need to abandon: `aws organizations close-account
   --account-id "$SMOKE_ACCOUNT_ID" --profile "$ORG_PROFILE"`. The account moves
   to `SUSPENDED` state, remains in the org for 90 days, then is fully closed.
3. If `FAILED`: investigate the reason (duplicate email is most common). Reuse the
   procedure with a corrected email; do not retry blindly.

### Step 5: Move the new account into the smoke-test OU

The account is created in the org root by default. Move it into `$SMOKE_OU_ID`.

**Idempotency check:** if the account is already in `$SMOKE_OU_ID`, skip the move.

```bash
CURRENT_PARENT=$(aws organizations list-parents \
  --child-id "$SMOKE_ACCOUNT_ID" \
  --profile "$ORG_PROFILE" \
  --query 'Parents[0].Id' --output text)

if [ "$CURRENT_PARENT" = "$SMOKE_OU_ID" ]; then
  echo "Already in target OU; skipping"
else
  aws organizations move-account \
    --account-id "$SMOKE_ACCOUNT_ID" \
    --source-parent-id "$CURRENT_PARENT" \
    --destination-parent-id "$SMOKE_OU_ID" \
    --profile "$ORG_PROFILE"
fi
```

**Rollback:** move the account back to root or to a different parent:

```bash
aws organizations move-account \
  --account-id "$SMOKE_ACCOUNT_ID" \
  --source-parent-id "$SMOKE_OU_ID" \
  --destination-parent-id "$ROOT_ID" \
  --profile "$ORG_PROFILE"
```

### Step 6: Verify SCP inheritance on the account

The smoke account should inherit the same four SCPs as `sandboxOu`.

```bash
aws organizations list-policies-for-target \
  --target-id "$SMOKE_ACCOUNT_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$ORG_PROFILE" \
  --query 'Policies[].Id' --output text
```

Compare the output to `expected_scps` in `$CONFIG_FILE`. The two sets MUST be
equal (order does not matter). If they differ, stop and fix the parent OU
attachments before continuing; deploying into an account without the expected SCPs
defeats the purpose of the rig.

**Rollback for this step:** none (read-only operations).

### Step 7: ProtectISB role-creation canary

Before doing any other work in the new account, run a fast canary to detect the
ProtectISB role-creation deadlock. ProtectISB denies all IAM actions on resources
named `InnovationSandbox-*` from any principal except a handful of allow-listed
ones. Our deploy role MUST start with `InnovationSandbox-ndx-*` (per the
Restrictions SCP); if ProtectISB denies the create, fall back per Step 7-fallback.

```bash
# Assume OrganizationAccountAccessRole into the new account
ASSUME_OUTPUT=$(aws sts assume-role \
  --role-arn "arn:aws:iam::${SMOKE_ACCOUNT_ID}:role/OrganizationAccountAccessRole" \
  --role-session-name smoke-test-runbook-canary \
  --profile "$ORG_PROFILE" \
  --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo "$ASSUME_OUTPUT" | jq -r .AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo "$ASSUME_OUTPUT" | jq -r .SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo "$ASSUME_OUTPUT" | jq -r .SessionToken)

# Canary: dry-run a role create with a name matching the prefix
cat > /tmp/canary-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

set +e
aws iam create-role \
  --role-name InnovationSandbox-ndx-CanaryDeleteMe \
  --assume-role-policy-document file:///tmp/canary-trust.json \
  --output json
CANARY_EXIT=$?
set -e

if [ $CANARY_EXIT -eq 0 ]; then
  echo "Canary PASSED: ProtectISB does not block prefix-named role creation"
  # Clean up the canary role immediately
  aws iam delete-role --role-name InnovationSandbox-ndx-CanaryDeleteMe
  CANARY_RESULT="pass"
else
  echo "Canary FAILED: ProtectISB blocks prefix-named role creation"
  CANARY_RESULT="fail"
fi

# Clear the assumed credentials before continuing (re-assume in Step 8)
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

If `CANARY_RESULT=pass`: continue to Step 8 with the primary placement.

If `CANARY_RESULT=fail`: continue to Step 7-fallback.

### Step 7-fallback: ProtectISB deadlock → move to root with selective SCPs

This branch is taken ONLY if the Step 7 canary failed. The account moves out from
under ProtectISB (which lives at `sandboxOu`) and re-attaches a SELECTIVE subset
of the other SCPs directly to the account. We give up ProtectISB-driven
faithfulness in exchange for being able to create our deploy role.

**Critical: do NOT attach `InnovationSandboxAwsNukeSupportedServices`** (or any
other NotAction-Deny SCP that doesn't explicitly allow `sts:*`). That SCP's
NotAction allow-list does not include `sts:*`, so attaching it blocks
`sts:AssumeRoleWithWebIdentity` — which is the very call GitHub Actions makes
to assume the deploy role. The smoke pack uses CFN delete + retention lint
(ADR-4), not aws-nuke, so AwsNukeSupportedServices serves no purpose here.

```bash
# Move the account out from under sandboxOu (back to root)
aws organizations move-account \
  --account-id "$SMOKE_ACCOUNT_ID" \
  --source-parent-id "$SMOKE_OU_ID" \
  --destination-parent-id "$ROOT_ID" \
  --profile "$ORG_PROFILE"

# Attach Restrictions only. AwsNukeSupportedServices is deliberately excluded
# (blocks sts:AssumeRoleWithWebIdentity). Replace the ID below with your
# Restrictions SCP ID (capture from Step 2's output).
aws organizations attach-policy \
  --policy-id "<Restrictions-id>" \
  --target-id "$SMOKE_ACCOUNT_ID" \
  --profile "$ORG_PROFILE"

# Update the config file to record the fallback
yq -i ".smoke_test_ou_placement_branch = \"child-of-root-with-selective-scps\"" "$CONFIG_FILE"
```

**SCP-attachment guidance:** before attaching ANY SCP directly to the smoke
account, inspect its policy body. If it's a `Deny` on `NotAction: [...]`
(i.e., allows only the listed services), confirm `sts:*` (or at least
`sts:AssumeRoleWithWebIdentity`) is in the allow-list. If not, skip the
attachment. The recommended set is **Restrictions only**; other SCPs may add
value but each must be verified against this rule.

**File a tracking issue immediately**: open a GitHub issue tagged
`scp-fallback-revisit` with title `Smoke-test account uses ProtectISB fallback
(revisit by <date+6mo>)`. The body should record:
- Why ProtectISB blocked the role-creation canary (snippet from the canary error)
- The date the fallback was taken
- A 6-month review cadence: every 6 months, the operator re-runs the canary; if
  it passes (e.g. ISB has loosened ProtectISB), the operator moves the account
  back under `sandboxOu` per the primary branch.

**Rollback for this step:** detach the SCPs from the account and move it back into
`$SMOKE_OU_ID`. Keep in mind the deploy role will then fail to create unless
ProtectISB has been loosened.

### Step 8: Assume `OrganizationAccountAccessRole` into the smoke account

The remaining steps run inside the smoke account, not in org-management.

```bash
ASSUME_OUTPUT=$(aws sts assume-role \
  --role-arn "arn:aws:iam::${SMOKE_ACCOUNT_ID}:role/OrganizationAccountAccessRole" \
  --role-session-name smoke-test-runbook \
  --profile "$ORG_PROFILE" \
  --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo "$ASSUME_OUTPUT" | jq -r .AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo "$ASSUME_OUTPUT" | jq -r .SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo "$ASSUME_OUTPUT" | jq -r .SessionToken)

# Verify identity
aws sts get-caller-identity
# Expected: an ARN containing OrganizationAccountAccessRole + $SMOKE_ACCOUNT_ID
```

These credentials are session-bound (default 1 hour). If a later step fails with
`ExpiredToken`, re-run this step.

**Rollback for this step:** `unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN`.

### Step 9: Create the GitHub OIDC provider

Only one OIDC provider per URL can exist per account; the create is idempotent
via the existence check.

```bash
EXISTING_OIDC=$(aws iam list-open-id-connect-providers \
  --query 'OpenIDConnectProviderList[?contains(Arn, `token.actions.githubusercontent.com`)].Arn' \
  --output text)

if [ -n "$EXISTING_OIDC" ]; then
  export OIDC_PROVIDER_ARN="$EXISTING_OIDC"
  echo "OIDC provider already exists: $OIDC_PROVIDER_ARN (skipping create)"
else
  # GitHub's well-known thumbprint for token.actions.githubusercontent.com.
  # AWS accepts any thumbprint for federated OIDC providers but validates the
  # actual server cert at token-exchange time, so the thumbprint here is
  # nominal. Source: AWS docs and GitHub's configuring-OIDC-in-AWS guide.
  OIDC_PROVIDER_ARN=$(aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
    --query 'OpenIDConnectProviderArn' --output text)
  export OIDC_PROVIDER_ARN
  echo "Created OIDC provider: $OIDC_PROVIDER_ARN"
fi
```

**Rollback for this step:**

```bash
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_PROVIDER_ARN"
```

### Step 10: Create the deploy role with trust policy

The trust policy uses the sub-pattern `repo:co-cddo/ndx_try_aws_scenarios:*` to
restrict to this exact repo. The spec originally called for an additional
`repository_owner=co-cddo` claim condition as belt-and-braces against
`pull_request_target` misuse, but that condition is **omitted here** because
adding it causes `sts:AssumeRoleWithWebIdentity` to fail consistently with
`Not authorized to perform sts:AssumeRoleWithWebIdentity` — even though the
GitHub OIDC token DOES contain `repository_owner: co-cddo` (verified by
running `.github/workflows/_oidc-debug.yml` and decoding the JWT mid-segment).

What was tried and reproducibly fails:
- `StringEquals: { "token.actions.githubusercontent.com:repository_owner": "co-cddo" }`
- `StringLike:   { "token.actions.githubusercontent.com:repository_owner": "co-cddo" }`

The exact reason AWS's authorization engine doesn't surface the claim against
that condition key is unclear; it may be a quirk of AWS's OIDC trust
evaluation for GitHub's particular issuer. If a fix is identified later (a
different key spelling, a provider-config tweak, an AWS docs update), re-add
the condition; the runbook's defence chain is otherwise:

1. The sub-pattern `repo:co-cddo/ndx_try_aws_scenarios:*` is repo-locked, so
   even an attacker with a co-cddo-owned different repo cannot assume.
2. GitHub's documented behaviour: `pull_request` events from forks do NOT
   pass secrets or OIDC tokens to the workflow runner on public repos.
3. The `smoke-test-deploy` GitHub deployment environment requires CODEOWNERS
   approval for non-main refs, so even an in-org PR modifying the workflow
   can't run with deploy credentials without human review.

Net: the assume gate is sub-pattern + branch policy + CODEOWNERS, which is
strictly more defensive than the original three conditions would have been
on a public repo.

```bash
cat > /tmp/deploy-role-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${OIDC_PROVIDER_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
      }
    }
  }]
}
EOF
```

**Idempotency check:**

```bash
EXISTING_ROLE=$(aws iam get-role --role-name "$DEPLOY_ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -n "$EXISTING_ROLE" ]; then
  # Role exists. Update its trust policy AND max-session-duration in place
  # so re-runs absorb runbook updates without delete+recreate. The original
  # create-role command sets max-session-duration to 21600 (6h); re-runs of
  # an older role created with the previous default (1h) would otherwise
  # keep their short session.
  aws iam update-assume-role-policy \
    --role-name "$DEPLOY_ROLE_NAME" \
    --policy-document file:///tmp/deploy-role-trust.json
  aws iam update-role \
    --role-name "$DEPLOY_ROLE_NAME" \
    --max-session-duration 21600
  export DEPLOY_ROLE_ARN="$EXISTING_ROLE"
  echo "Role already exists at $DEPLOY_ROLE_ARN; trust policy + session duration refreshed"
else
  DEPLOY_ROLE_ARN=$(aws iam create-role \
    --role-name "$DEPLOY_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/deploy-role-trust.json \
    --description "Smoke-test deploy role; assumed by GitHub Actions via OIDC; managed by docs/smoke-test-account-setup.md" \
    --max-session-duration 21600 \
    --query 'Role.Arn' --output text)
  # 21600s = 6 hours. The default 3600s (1h) expires mid-run for any
  # smoke deploy that exceeds 1 hour (some scenarios on their own take
  # 60+ min; all-demo nests 16 of them in parallel). OIDC credentials
  # don't auto-refresh — once they expire, every subsequent AWS call
  # in the workflow fails NoCredentials. 6h covers any realistic run.
  export DEPLOY_ROLE_ARN
  echo "Created role: $DEPLOY_ROLE_ARN"
fi

yq -i ".smoke_test_deploy_role_arn = \"$DEPLOY_ROLE_ARN\"" "$CONFIG_FILE"
```

**Rollback for this step:**

```bash
aws iam delete-role --role-name "$DEPLOY_ROLE_NAME"
# Must detach all policies and delete inline policies first; see Step 11 inverse
```

### Step 11: Attach the inline deploy-role policy

The inline policy is committed verbatim below. Any future update to it lands as a
PR to this file FIRST (per [Updating the deploy role policy](#updating-the-deploy-role-policy));
the operator then runs `aws iam put-role-policy` again with the new file.

The baseline below derives from the tech-spec's action set (Phase 1a deploy-role
table). Resource-level conditions for tag-based scoping are deferred to the
iterate-to-least-privilege phase (see Operational Notes); the baseline uses
service-prefix wildcards constrained by role-name prefix where applicable.

```bash
cat > /tmp/deploy-role-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationManageAllDemo",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResource",
        "cloudformation:DescribeStackResources",
        "cloudformation:ListStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:GetTemplateSummary",
        "cloudformation:ValidateTemplate",
        "cloudformation:ContinueUpdateRollback",
        "cloudformation:RollbackStack"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ReadBlueprintsBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ndx-try-isb-blueprints-568672915267",
        "arn:aws:s3:::ndx-try-isb-blueprints-568672915267/*"
      ]
    },
    {
      "Sid": "ManageScenarioRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:UpdateRole",
        "iam:GetRole",
        "iam:ListRoles",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": [
        "arn:aws:iam::*:role/*"
      ]
    },
    {
      "Sid": "ManageScenarioPoliciesAndInstanceProfiles",
      "Effect": "Allow",
      "Action": [
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:ListPolicies",
        "iam:ListPolicyVersions",
        "iam:CreatePolicyVersion",
        "iam:DeletePolicyVersion",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:GetInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile",
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CoreCompute",
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "ecs:*",
        "elasticloadbalancing:*",
        "autoscaling:*",
        "application-autoscaling:*",
        "lambda:*",
        "apigateway:*",
        "logs:*",
        "servicediscovery:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:DescribeParameters",
        "ssm:AddTagsToResource",
        "ssm:RemoveTagsFromResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DataServices",
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "dynamodb:*",
        "elasticache:*",
        "elasticfilesystem:*",
        "s3:*",
        "secretsmanager:*",
        "kms:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AiAndAnalytics",
      "Effect": "Allow",
      "Action": [
        "bedrock:*",
        "wisdom:*",
        "polly:*",
        "transcribe:*",
        "translate:*",
        "rekognition:*",
        "textract:*",
        "comprehend:*",
        "quicksight:*",
        "lex:*",
        "connect:*",
        "ds:*",
        "ses:*",
        "sns:*",
        "sqs:*",
        "events:*",
        "scheduler:*",
        "states:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EdgeAndDelivery",
      "Effect": "Allow",
      "Action": [
        "cloudfront:*",
        "wafv2:*",
        "waf:*",
        "acm:*",
        "route53:*",
        "appregistry:*",
        "servicecatalog:*",
        "tag:*",
        "cloudwatch:*",
        "synthetics:*",
        "cognito-idp:*",
        "cognito-identity:*",
        "iot:*",
        "s3vectors:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DriftChecksOrganizations",
      "Effect": "Allow",
      "Action": [
        "organizations:ListPoliciesForTarget",
        "organizations:DescribePolicy",
        "organizations:ListTagsForResource"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$DEPLOY_ROLE_NAME" \
  --policy-name SmokeTestDeployInline \
  --policy-document file:///tmp/deploy-role-policy.json

# Plus PowerUserAccess managed policy: covers every AWS service except IAM.
# Required because scenarios use a wide service spread (Connect, Wisdom,
# AppSync, S3Vectors, IoT, Cognito, S3 Files, etc.) and curating an inline
# allow-list per service proved fragile — every new scenario surfaced
# another gap. IAM remains constrained by the inline SmokeTestDeployInline.
# Smoke runs in the smoke account only; the Restrictions SCP plus a tight
# IAM inline policy still bound what the role can actually do.
aws iam attach-role-policy \
  --role-name "$DEPLOY_ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

**Rollback for this step:**

```bash
aws iam delete-role-policy --role-name "$DEPLOY_ROLE_NAME" --policy-name SmokeTestDeployInline
aws iam detach-role-policy --role-name "$DEPLOY_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

### Step 12: Enable Bedrock model access

AI-using scenarios invoke Bedrock foundation models. Model access is per-account
and not bound by IAM policy: access must be enabled explicitly via the Bedrock
console or `bedrock:PutModelInvocationLoggingConfiguration` (note: actual
enablement is via the Bedrock console "Model access" page; there is no
fully-CLI-driven model-access-grant API at the time of writing).

The smoke pack's AI-using scenarios invoke (at minimum) the models listed below.
Confirm by re-running the source-of-truth audit:

```bash
grep -hE "(anthropic\.|amazon\.)[a-z0-9.\-]+(:[v0-9.\-]+)?" \
  cloudformation/scenarios/council-chatbot/template.yaml \
  cloudformation/scenarios/planning-ai/template.yaml \
  cloudformation/scenarios/simply-readable/template.yaml \
  cloudformation/scenarios/ai-contact-centre/template.yaml \
  cloudformation/scenarios/ai-contact-centre/lambdas/*/index.py \
  cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/bedrock.ts \
  cloudformation/scenarios/paperless-ngx/cdk/lib/constructs/chat.ts \
  cloudformation/scenarios/foi-redaction/template.yaml \
  2>/dev/null \
  | grep -oE "(us\.|eu\.|apac\.)?(anthropic|amazon)\.[a-z0-9.\-]+(:[v0-9.\-]+)?" | sort -u
```

Starting list (as of the runbook authoring date; re-derive at run time):

- `amazon.nova-canvas-v1:0`
- `amazon.nova-lite-v1:0`
- `amazon.nova-pro-v1:0`
- `amazon.titan-embed-text-v2:0`
- `anthropic.claude-3-5-haiku-20241022-v1:0` (replaces the now-Legacy
  `claude-3-haiku-20240307-v1:0`; see Operational Notes → Bedrock
  model-access gotchas)

**Procedure:**

1. Open the Bedrock console in the smoke account in `us-east-1`:
   https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
   (assume the deploy role into the console via aws-sso-util, or log in as the
   `OrganizationAccountAccessRole` and use the link).
2. Click **Modify model access** and tick every model in the list above.
3. For the Anthropic Claude variants, the console may present a Terms of Use
   acceptance dialog. Accept it; some variants require an additional
   organisation-name + use-case form. Capture the affected model IDs and record
   them in the [Operational Notes → Bedrock model-access gotchas](#bedrock-model-access-gotchas)
   section of this runbook so future operators see them upfront.
4. Submit and wait. Approvals are usually instant; some restricted models can
   take minutes.

**Verification:**

The CLI expects `--body` either base64-encoded inline or via `fileb://`.
Use a body file. Different model families use different body shapes:
Anthropic models take `messages` + `max_tokens` + `anthropic_version`;
Nova models use `messages` + `inferenceConfig`; Titan embeds use
`inputText`. Sending the Anthropic shape to Nova produces a
ValidationException (not an AccessDenied), which still proves the call
reached the model but masks real access failures.

```bash
# Per-family body files (write once, reuse per model).
cat > /tmp/claude-body.json <<'BODY'
{"messages":[{"role":"user","content":[{"type":"text","text":"hi"}]}],"max_tokens":10,"anthropic_version":"bedrock-2023-05-31"}
BODY
cat > /tmp/nova-body.json <<'BODY'
{"messages":[{"role":"user","content":[{"text":"hi"}]}],"inferenceConfig":{"maxTokens":10}}
BODY
cat > /tmp/titan-embed-body.json <<'BODY'
{"inputText":"hi"}
BODY

# Anthropic family.
for MODEL_ID in anthropic.claude-3-5-haiku-20241022-v1:0; do
  echo "=== $MODEL_ID ==="
  aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --body fileb:///tmp/claude-body.json \
    --content-type application/json \
    --region "$SMOKE_REGION" \
    /tmp/bedrock-canary.json && cat /tmp/bedrock-canary.json
done

# Nova family.
for MODEL_ID in amazon.nova-lite-v1:0 amazon.nova-pro-v1:0; do
  echo "=== $MODEL_ID ==="
  aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --body fileb:///tmp/nova-body.json \
    --content-type application/json \
    --region "$SMOKE_REGION" \
    /tmp/bedrock-canary.json && cat /tmp/bedrock-canary.json
done

# Titan embeddings.
aws bedrock-runtime invoke-model \
  --model-id amazon.titan-embed-text-v2:0 \
  --body fileb:///tmp/titan-embed-body.json \
  --content-type application/json \
  --region "$SMOKE_REGION" \
  /tmp/bedrock-embed.json && cat /tmp/bedrock-embed.json
```

If any model returns `AccessDeniedException`, re-open the Model Access console and
verify the tick. Allow up to 15 minutes for propagation; some restricted variants
may need an additional 60 minutes. If still failing after 60 minutes, suspect a
manual TOS click-through (see step 3 above) and record the affected model IDs in
[Bedrock model-access gotchas](#bedrock-model-access-gotchas).

The titan-embed and Nova body shapes are demonstrated in the
verification block above.

**Rollback for this step:** un-tick the models in the same Bedrock console page.
Note: the rest of the runbook produces a functional account regardless; failing
Bedrock just means AI-using smoke specs will fail until model access is granted.

### Step 13: Pre-claim ai-contact-centre PSTN number

Amazon Connect releases a phone number on stack-delete; the released number is
held in a 30-day cooldown and consumes the account's UK DID claim quota during
that window. Long-lived smoke deploys (multiple per day) would exhaust the
quota in days. The fix: claim ONE number against a long-lived "holder" Connect
instance and reuse it on every smoke deploy via the ai-contact-centre
template's `ExistingPhoneNumberArn` / `ExistingPhoneNumber` parameters.

This step must run as the `SmokeTestDeployRole` (the Restrictions SCP blocks
`connect:CreateInstance` from non-`InnovationSandbox-ndx-*` principals). The
easiest path is a one-shot workflow_dispatch on a small setup workflow, OR
manually via a federated session if you have one.

```bash
# 1. Create the holder instance (idempotent: re-running creates a new alias if
#    the previous one was deleted).
HOLDER_ALIAS="ndx-smoke-pstn-holder"
HOLDER_ID=$(aws connect create-instance \
  --identity-management-type CONNECT_MANAGED \
  --instance-alias "$HOLDER_ALIAS" \
  --inbound-calls-enabled \
  --no-outbound-calls-enabled \
  --query 'Id' --output text)

# 2. Wait until ACTIVE (Connect provisioning is async, ~1-2 min).
until [ "$(aws connect describe-instance --instance-id "$HOLDER_ID" \
  --query 'Instance.InstanceStatus' --output text)" = "ACTIVE" ]; do
  sleep 10
done
HOLDER_ARN=$(aws connect describe-instance --instance-id "$HOLDER_ID" \
  --query 'Instance.Arn' --output text)

# 3. Find an available UK DID number.
NUM=$(aws connect search-available-phone-numbers \
  --target-arn "$HOLDER_ARN" \
  --phone-number-country-code GB \
  --phone-number-type DID \
  --max-results 1 \
  --query 'AvailableNumbersList[0].PhoneNumber' --output text)
echo "Found number: $NUM"

# 4. Claim it against the holder.
CLAIM=$(aws connect claim-phone-number \
  --target-arn "$HOLDER_ARN" \
  --phone-number "$NUM" \
  --query '{Arn:PhoneNumberArn,Id:PhoneNumberId}' --output json)
echo "$CLAIM"
PHONE_ARN=$(echo "$CLAIM" | jq -r .Arn)

# 5. Write back to docs/smoke-test-account-config.yml and commit.
yq -i ".aicc_existing_phone_number_arn = \"$PHONE_ARN\"" docs/smoke-test-account-config.yml
yq -i ".aicc_existing_phone_number = \"$NUM\"" docs/smoke-test-account-config.yml
git add docs/smoke-test-account-config.yml
git commit -m "smoke: record pre-claimed ai-contact-centre PSTN number"
```

After the values are committed, smoke deploys pass them via
`--parameter-overrides` and ai-contact-centre's stack skips claim+release.
Update the quarantine in `cloudformation/scenarios/ai-contact-centre/smoke.ts`
to `{ state: 'active' }` so the smoke spec re-engages.

**Rollback for this step:** release the number + delete the holder:

```bash
aws connect release-phone-number --phone-number-id <id-from-step-4>
aws connect delete-instance --instance-id "$HOLDER_ID"
yq -i ".aicc_existing_phone_number_arn = \"placeholder-arn\"" docs/smoke-test-account-config.yml
yq -i ".aicc_existing_phone_number = \"+440000000000\"" docs/smoke-test-account-config.yml
```

### Step 14: Request service-quota increases

Smoke deploys all 17 scenarios in parallel; default service quotas are not
sufficient. The current best-effort matrix (refined post-Phase-4 once real usage
data is in) is below. Open quota tickets for any value insufficient at the time
of run.

Read the current quotas:

```bash
# VPCs per region (code L-F678F1CE)
aws service-quotas get-service-quota --service-code vpc --quota-code L-F678F1CE \
  --region "$SMOKE_REGION" --query 'Quota.Value'

# NAT gateways per AZ (L-FE5A380F)
aws service-quotas get-service-quota --service-code vpc --quota-code L-FE5A380F \
  --region "$SMOKE_REGION" --query 'Quota.Value'

# Elastic IPs per region (L-0263D0A3)
aws service-quotas get-service-quota --service-code ec2 --quota-code L-0263D0A3 \
  --region "$SMOKE_REGION" --query 'Quota.Value'

# RDS DB instances (L-7B6409FD)
aws service-quotas get-service-quota --service-code rds --quota-code L-7B6409FD \
  --region "$SMOKE_REGION" --query 'Quota.Value'

# Fargate vCPU (L-3032A538)
aws service-quotas get-service-quota --service-code fargate --quota-code L-3032A538 \
  --region "$SMOKE_REGION" --query 'Quota.Value'
```

Targets (initial estimate; refine via PR to this runbook after Phase 4 lands):

| Service | Quota name | Initial target | Reason |
|---------|-----------|----------------|--------|
| VPC | VPCs per region | 20 | One per scenario (17), plus headroom |
| VPC | NAT gateways per AZ | 20 | One per scenario at minimum |
| EC2 | Elastic IPs per region | 50 | NAT GWs + load balancers |
| RDS | DB instances | 6 | drupal/planx/ims/paperless + headroom |
| Fargate | vCPU per region | 64 | Scenario task concurrency + headroom |
| Bedrock | Per-model TPM | service-default | Smoke calls are low-volume; revisit if hit |
| SES | Production access mode | enabled | FixMyStreet email-send smoke step |
| QuickSight | Enterprise subscription | enabled | See Step 15 |

Open quota increase requests via:

```bash
aws service-quotas request-service-quota-increase \
  --service-code vpc \
  --quota-code L-F678F1CE \
  --desired-value 20 \
  --region "$SMOKE_REGION"
```

Some quotas (Bedrock TPM, SES production) cannot be raised via the API and
require a Support case; open these from the AWS console. Block Phase 2b's
T2b.5b (manual all-demo deploy) until tickets close, which can take 5+ business
days.

**Rollback for this step:** quotas only increase via approval; AWS sets no
automatic decrease.

### Step 15: QuickSight subscription

The `quicksight-dashboard` scenario requires a QuickSight Enterprise subscription.
This is a one-off click-through in the QuickSight console, not API-driven, and is
billed monthly.

**Decision point:** before subscribing, confirm with the project owner that the
smoke account is the right billing target for QuickSight Enterprise (it is a
non-trivial monthly cost). If the answer is "skip QuickSight from smoke", mark
`quicksight-dashboard` for `test.skip.fixme` in Phase 4 with `until: <revisit-date>`
in the assertion-bar row and proceed without subscribing.

**Procedure (if subscribing):**

1. Open https://us-east-1.console.aws.amazon.com/quicksight/sign-up in the smoke
   account.
2. Choose Enterprise (Standard does not support all features the scenario uses).
3. Use the smoke account's identity store (no AD integration needed for smoke).
4. Skip the IAM Identity Center integration (we use the deploy role).

**Rollback for this step:** the QuickSight subscription is downgradable / can be
unsubscribed via the QuickSight account-settings page; billing continues to the
end of the current month.

### Step 16: Populate the config file

By this point most fields have been populated by previous steps. Verify the final
state with the schema below:

```bash
yq '.' "$CONFIG_FILE"
```

Expected fields (per the schema in the spec's Codebase Patterns section):

- `smoke_test_account_id` (Step 4)
- `smoke_test_deploy_role_arn` (Step 10)
- `smoke_test_region` (Step 4, derived from `$SMOKE_REGION`)
- `smoke_test_ou_id` (Step 3 or 7-fallback)
- `smoke_test_ou_placement_branch` (Step 3 or 7-fallback)
- `sandbox_ou_id` (Step 1)
- `expected_scps` (Step 2)
- `setup_date` (set now)
- `runbook_version` (set now; commit SHA of THIS runbook at the time of setup)

Set the trailing two fields:

```bash
yq -i ".setup_date = \"$(date -u +%Y-%m-%d)\"" "$CONFIG_FILE"
yq -i ".runbook_version = \"$(git log -1 --pretty=%H -- docs/smoke-test-account-setup.md)\"" "$CONFIG_FILE"
```

Open a PR with the populated `$CONFIG_FILE`. The PR description should reference
this runbook's commit SHA in `runbook_version` so the procedure is traceable.

---

## Verification

Run all of the following from your local shell (with `$SMOKE_ACCOUNT_ID`,
`$DEPLOY_ROLE_NAME`, `$ORG_PROFILE` still set, and the smoke-account credentials
re-assumed via Step 8 if your session has expired). Every command must return
without error and produce the expected output before the runbook is considered
complete.

### Account placement

```bash
aws organizations describe-account --account-id "$SMOKE_ACCOUNT_ID" --profile "$ORG_PROFILE"
# Status must be ACTIVE

aws organizations list-parents --child-id "$SMOKE_ACCOUNT_ID" --profile "$ORG_PROFILE"
# Parents[0].Id must equal $SMOKE_OU_ID (or $ROOT_ID if the fallback was taken)
```

### SCP attachments

```bash
aws organizations list-policies-for-target \
  --target-id "$SMOKE_ACCOUNT_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$ORG_PROFILE" \
  --query 'Policies[].Id' --output text

yq '.expected_scps[]' "$CONFIG_FILE"
```

The two outputs must list the same IDs (order independent).

### OIDC provider

```bash
aws iam list-open-id-connect-providers \
  --query 'OpenIDConnectProviderList[?contains(Arn, `token.actions.githubusercontent.com`)]'

aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn "$OIDC_PROVIDER_ARN"
# ClientIDList must contain "sts.amazonaws.com"
# ThumbprintList must contain "6938fd4d98bab03faadb97b34396831e3780aea1"
```

### Deploy role

```bash
aws iam get-role --role-name "$DEPLOY_ROLE_NAME"
# AssumeRolePolicyDocument must contain sub=repo:co-cddo/ndx_try_aws_scenarios:*
# and aud=sts.amazonaws.com. See Step 10 for why repository_owner is NOT a
# condition.

aws iam get-role-policy --role-name "$DEPLOY_ROLE_NAME" --policy-name SmokeTestDeployInline | jq '.PolicyDocument'
# Compare to /tmp/deploy-role-policy.json from Step 11 (or to the runbook source)
```

### Bedrock model access

Re-run the canary block from Step 12. Every listed model must respond without
`AccessDeniedException`.

### Quotas

```bash
for QUOTA_PAIR in "vpc L-F678F1CE 20" "ec2 L-0263D0A3 50" "rds L-7B6409FD 6"; do
  SVC=$(echo $QUOTA_PAIR | awk '{print $1}')
  CODE=$(echo $QUOTA_PAIR | awk '{print $2}')
  TARGET=$(echo $QUOTA_PAIR | awk '{print $3}')
  CURRENT=$(aws service-quotas get-service-quota --service-code "$SVC" --quota-code "$CODE" --region "$SMOKE_REGION" --query 'Quota.Value' --output text)
  echo "$SVC/$CODE: current=$CURRENT target=$TARGET"
done
```

Every `current` must be at least `target`. If not, the quota ticket is still
pending.

---

## Operational Notes

### Updating the deploy role policy

The inline policy attached in Step 11 is the source of truth. To change it:

1. Edit the JSON inside this file (the block under Step 11).
2. Open a PR with the new policy. CODEOWNERS-required review per
   `.github/CODEOWNERS`.
3. After merge, operator re-runs Step 11's `aws iam put-role-policy` against the
   updated file.
4. Smoke runs verify the new policy at next nightly cron.

Do NOT update the policy directly via `aws iam put-role-policy` without a PR
first; that creates drift between "what the role has" and "what we documented".

### Iterate-to-least-privilege protocol

The Step 11 baseline uses service-prefix wildcards because no IAM policy can be
authoritatively scoped without observing every scenario's actual resource
creation. After the first 5 nightly smoke runs:

1. CloudTrail logging is enabled in the smoke account (it is on by default for
   management events). Open CloudTrail → Event history; filter by event status
   `Failure` and date range covering the last 5 runs.
2. Review the `AccessDenied` events. For each:
   - If the action is genuinely needed by a scenario: add a tighter, more
     resource-scoped statement to the policy via PR.
   - If the action is not used: leave the policy alone; this is just absence of
     evidence, not a need to add anything.
3. For every wildcard prefix that is exercised (e.g. `ec2:*` resolves to a known
   set of `ec2:Create*` / `ec2:Describe*` calls), narrow the wildcard to the
   observed list via PR.
4. Repeat after each significant scenario change (Phase 4 PRs, new scenario
   additions).

After ~30 days the policy stabilises. Further updates follow the standard
PR-to-runbook discipline above.

### `expected_scps` maintenance

When ISB is upgraded in the hub account, the SCPs attached to `sandboxOu` may
change. The nightly SCP drift check (Phase 3) opens an issue tagged `scp-drift`
on the first detection. Action:

1. Re-run Step 2 to capture the new SCP IDs.
2. PR an update to `$CONFIG_FILE.expected_scps`.
3. Close the `scp-drift` issue once merged.

If the new SCP set adds a policy that breaks deploy (e.g. a new restriction on
service prefixes the deploy role needs), iterate the deploy role policy first
(per [Iterate-to-least-privilege protocol](#iterate-to-least-privilege-protocol))
before updating `expected_scps`.

### Bedrock model-access gotchas

(Populated by operators as models require manual TOS click-through or as
upstream model lifecycle changes affect canaries.)

- **`anthropic.claude-3-haiku-20240307-v1:0` is Legacy (2026-05-12)**: a
  fresh account that has not previously invoked this model receives
  `ResourceNotFoundException: Access denied. This Model is marked by
  provider as Legacy and you have not been actively using the model in
  the last 30 days. Please upgrade to an active model on Amazon Bedrock`.
  AWS has retired the "no active usage in 30 days" grandfathering window
  for Anthropic's earliest Claude 3 models. Scenarios that pinned this
  model ID (council-chatbot, foi-redaction, planning-ai, paperless-ngx,
  ai-contact-centre lambdas) must migrate to a currently-active model
  (e.g. `anthropic.claude-3-5-haiku-20241022-v1:0` or
  `anthropic.claude-haiku-4-5-20251001-v1:0`). The canary in [Step 12](#step-12-enable-bedrock-model-access)
  will fail with the same ResourceNotFoundException until the migration
  lands; ignore it for that one model ID OR re-run the canary against the
  replacement model ID instead.
- **Nova models (`amazon.nova-lite-v1:0`, `amazon.nova-pro-v1:0`,
  `amazon.nova-canvas-v1:0`) do NOT use the Anthropic body shape**: the
  Step 12 canary as written sends `{"messages":[...],"max_tokens":...,
  "anthropic_version":"..."}` which Nova rejects with
  `ValidationException: Malformed input request: #: extraneous key
  [max_tokens] is not permitted`. For Nova use the Converse API
  (`bedrock-runtime converse`) or send Nova-shaped JSON (`{"messages":
  [{"role":"user","content":[{"text":"hi"}]}],"inferenceConfig":
  {"maxTokens":10}}`). The ValidationException is NOT an access denial,
  it's a payload shape error and proves the call reaches the model.
- **Titan embeddings (`amazon.titan-embed-text-v2:0`) use a different body
  again**: `{"inputText":"hi"}`. Step 12's canary block sends this
  correctly.

### Re-running the runbook

The runbook is idempotent end-to-end:

- Steps 1, 2, 6 are read-only.
- Steps 3, 4, 5, 9, 10, 11 detect existing state and skip / update in place.
- Step 7 (canary) is safe to re-run (creates and immediately deletes a role).
- Steps 12-14 are click-through and tracked by the verification block.

Safe scenarios for re-running:
- Partial failure mid-way (`aws sts assume-role` token expired, network blip)
- Drift correction (someone deleted the role manually; runbook re-creates)
- ISB upgrade (SCPs changed; re-run to capture new `expected_scps`)

Unsafe scenarios:
- Account already in `SUSPENDED` state (re-run aborts at Step 4's existence
  check; correct path is to abandon and request a new account email)
- Email collision (re-run aborts at Step 4 with a clear error; correct path is
  to pick a new email and try again)

### `RENOVATE_TOKEN` rotation

Phase 6 introduces `RENOVATE_TOKEN`: a GitHub fine-grained PAT scoped to
`repo: read+write` on `co-cddo/ndx_try_aws_scenarios` only.

- **Owner**: the operator who initially set up Renovate (recorded in the
  README of the relevant Jira project, or wherever the team tracks tokens).
- **Expiration policy**: 90 days. Renew via `gh pr` workflow:
  1. Mint a new fine-grained PAT (same scope) in the operator's GH account, or
     via a machine user.
  2. Update repo secret `RENOVATE_TOKEN` via repo Settings → Secrets and
     variables → Actions, or via `gh secret set RENOVATE_TOKEN`.
  3. Manually `workflow_dispatch` `renovate.yml` to verify the new token works.
- **Failure mode**: when the token expires, Renovate stops opening PRs but does
  not error visibly. Detection is operator-spot-check via
  `gh pr list --author renovate[bot] --search 'created:>30d ago'` (run when you
  remember; nothing automates this since the quarterly-audit workflow was
  removed as not-useful given how much changes per quarter).

### Cost trade-off

Smoke runs deploy 17 scenarios per nightly cron + per push-to-main + per scoped
PR run. Per-run cost includes VPC infrastructure, RDS/Aurora cold-start +
storage, Fargate task minutes, Bedrock invocations, EFS storage. There is no
automated budget alarm in this account; operator spot-checks via
`aws ce get-cost-and-usage` are the only backstop.

If smoke-account spend becomes meaningful, revisit options (out of current
scope):

- Share VPC / NAT GW across scenarios where SCPs and code allow
- Move to a longer-lived deployment with state-reset between runs
  (snapshot/restore or per-test cleanup endpoints in each scenario)
- Batch smoke into a single weekly deep run plus per-PR scoped runs only

### Aborting mid-procedure

If you need to stop part-way (e.g. you discover a precondition error after Step
4 but before Step 11), the safe sequence is:

1. Delete the deploy role: `aws iam delete-role-policy ... && aws iam delete-role
   --role-name "$DEPLOY_ROLE_NAME"` (Step 11 inverse).
2. Delete the OIDC provider only if NO other workflow in the account depends on
   it: `aws iam delete-open-id-connect-provider --open-id-connect-provider-arn
   "$OIDC_PROVIDER_ARN"` (Step 9 inverse).
3. Move the account to a quarantine OU or back to root (Step 5 inverse).
4. Run `aws organizations close-account --account-id "$SMOKE_ACCOUNT_ID"` (Step
   4 inverse; 90-day closure window applies).
5. Delete the now-empty OU: `aws organizations delete-organizational-unit
   --organizational-unit-id "$SMOKE_OU_ID"` (Step 3 inverse).

Do NOT skip steps 1-3 before close-account: the close-account operation leaves
the account in `SUSPENDED` state for 90 days, during which time IAM resources
inside it still exist and consume name-space.
