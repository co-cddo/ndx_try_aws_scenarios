#!/usr/bin/env bash
# Smoke-pack entrypoint. Runs identically under local dev and CI (CI authn is
# OIDC-driven and happens upstream; local authn is SSO via SMOKE_AWS_PROFILE).
# Phase 3 / T3.4 of the scenario-regression smoke-pack tech-spec.
#
# Local invocation:
#   export SMOKE_STACK_NAME=all-demo
#   export SMOKE_AWS_REGION=us-east-1
#   export SMOKE_AWS_PROFILE=NDX/<smoke-account-sso-profile>
#   ./scripts/smoke.sh                       # full smoke
#   ./scripts/smoke.sh --grep fixmystreet    # one scenario
#
# CI invocation (via .github/workflows/smoke.yml): the OIDC role's credentials
# are exported by aws-actions/configure-aws-credentials upstream; SMOKE_AWS_PROFILE
# is unset.
#
# Deploy/teardown is by-runbook documentation, not in this script: local
# operators follow the same `aws cloudformation deploy ... && ./scripts/smoke.sh
# && aws cloudformation delete-stack` sequence that the CI workflow runs.
# Unifying deploy/teardown into the script would force its inputs to diverge
# between local (manual stack name) and CI (matrix-driven scoped scenarios).

set -euo pipefail

# Required env vars. Fail fast and helpfully on omission.
: "${SMOKE_STACK_NAME:?SMOKE_STACK_NAME is required (default: all-demo). See .env.example.}"
: "${SMOKE_AWS_REGION:?SMOKE_AWS_REGION is required (us-east-1). See .env.example.}"

if [ "${CI:-}" = "true" ]; then
  # CI: credentials are already exported by configure-aws-credentials.
  # Reject SMOKE_AWS_PROFILE if accidentally set; it would override the OIDC
  # credentials and assume a profile that doesn't exist on the runner.
  if [ -n "${SMOKE_AWS_PROFILE:-}" ]; then
    echo "ERROR: SMOKE_AWS_PROFILE must NOT be set on CI; OIDC credentials are already exported." >&2
    exit 2
  fi
else
  # Local: require SMOKE_AWS_PROFILE so SDK calls hit the smoke account, not
  # whatever default profile the developer happens to have logged into.
  : "${SMOKE_AWS_PROFILE:?SMOKE_AWS_PROFILE is required for local runs (e.g. NDX/SmokeTest). See .env.example.}"
  export AWS_PROFILE="$SMOKE_AWS_PROFILE"
fi

# The CFN-outputs helper resolves via the standard SDK v3 credential chain;
# AWS_PROFILE on local + the assumed OIDC role on CI both feed into that.
# AWS_REGION must be set so the SDK doesn't default to its config-file value.
export AWS_REGION="$SMOKE_AWS_REGION"

# Tell Playwright we want the smoke project (no webServer, no baseURL).
export PLAYWRIGHT_SUITE="smoke"

# Make SMOKE_STACK_NAME readable inside specs without re-deriving it.
# (Specs pass this to cfn-outputs.fetchStackOutputs.)
export SMOKE_STACK_NAME

cd "$(dirname "$0")/.."

# Pass through any additional flags (e.g. --grep planx) to Playwright.
exec npx playwright test --project=smoke "$@"
