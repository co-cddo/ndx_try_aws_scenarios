#!/usr/bin/env bash
# Smoke-pack entrypoint. Same invocation locally and in CI.
#
# Local:
#   export SMOKE_STACK_NAME=all-demo
#   export SMOKE_AWS_REGION=us-east-1
#   export SMOKE_AWS_PROFILE=NDX/<smoke-account-sso-profile>
#   ./scripts/smoke.sh                       # full smoke
#   ./scripts/smoke.sh --grep fixmystreet    # one scenario
#
# CI: SMOKE_AWS_PROFILE is unset; OIDC credentials are pre-exported by
# aws-actions/configure-aws-credentials.

set -euo pipefail

: "${SMOKE_STACK_NAME:?SMOKE_STACK_NAME is required (default: all-demo)}"
: "${SMOKE_AWS_REGION:?SMOKE_AWS_REGION is required (us-east-1)}"

if [ "${CI:-}" = "true" ]; then
  if [ -n "${SMOKE_AWS_PROFILE:-}" ]; then
    echo "ERROR: SMOKE_AWS_PROFILE must NOT be set on CI; OIDC credentials are already exported." >&2
    exit 2
  fi
else
  : "${SMOKE_AWS_PROFILE:?SMOKE_AWS_PROFILE is required for local runs (e.g. NDX/SmokeTest)}"
  export AWS_PROFILE="$SMOKE_AWS_PROFILE"
fi

export AWS_REGION="$SMOKE_AWS_REGION"
export PLAYWRIGHT_SUITE="smoke"
export SMOKE_STACK_NAME

cd "$(dirname "$0")/.."

exec npx playwright test --project=smoke "$@"
