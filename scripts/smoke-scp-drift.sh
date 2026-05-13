#!/usr/bin/env bash
# Compares the smoke account's currently-attached SCPs against the
# expected_scps list in docs/smoke-test-account-config.yml.
# Opens / comments on a scp-drift issue when they diverge; fails the
# build after the issue has accumulated >= 7 detection comments.
#
# Inputs (env):
#   ACCOUNT_ID       the smoke account's 12-digit ID
#   GH_TOKEN         for gh CLI
#
# Exits 0 on match or when the deploy role can't read Organizations
# (drift check is informational, not gating).

set -euo pipefail

# p-FullAWSAccess is AWS-managed and implicitly attached; exclude from compare.
EXPECTED=$(yq -r '.expected_scps[]' docs/smoke-test-account-config.yml \
  | grep -v '^p-FullAWSAccess$' | sort -u)
ACTUAL=$(aws organizations list-policies-for-target \
  --target-id "${ACCOUNT_ID}" \
  --filter SERVICE_CONTROL_POLICY \
  --query 'Policies[].Id' --output text 2>/dev/null \
  | tr '\t' '\n' | grep -v '^p-FullAWSAccess$' | sort -u || true)

if [ -z "$ACTUAL" ]; then
  echo "Could not enumerate live SCPs (deploy role lacks organizations:ListPoliciesForTarget); skipping"
  exit 0
fi
if [ "$EXPECTED" = "$ACTUAL" ]; then
  echo "SCP drift check: live attachments match expected_scps"
  exit 0
fi

echo "SCP drift detected"
echo "Expected:" && echo "$EXPECTED" | sed 's/^/  /'
echo "Actual:" && echo "$ACTUAL" | sed 's/^/  /'

BODY="Live SCP attachments differ from docs/smoke-test-account-config.yml expected_scps."
ISSUE_NUM=$(gh issue list --state open --label scp-drift --json number --jq '.[0].number' || true)
if [ -z "$ISSUE_NUM" ]; then
  gh issue create --title "scp-drift detected on smoke-test account" --label scp-drift --body "$BODY"
  ISSUE_NUM=$(gh issue list --state open --label scp-drift --json number --jq '.[0].number')
fi
gh issue comment "$ISSUE_NUM" --body "Drift still present at $(date -u +%FT%TZ); run ${GITHUB_RUN_ID}"
COUNT=$(gh issue view "$ISSUE_NUM" --json comments --jq '.comments | length')
if [ "$COUNT" -ge 7 ]; then
  echo "scp-drift persisted >= 7 nightly runs (issue #$ISSUE_NUM); failing the build" >&2
  exit 1
fi
