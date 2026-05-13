#!/usr/bin/env bash
# Captures stack events + resource list to artefacts/. Failure-tolerant: the
# captured state is more useful than nothing even on partial deploys.
#
# Inputs (env):
#   STACK   name of the stack to query

set -euo pipefail

mkdir -p artefacts
if [ -z "${STACK:-}" ]; then
  echo "No stack name resolved; skipping events capture"
  exit 0
fi

aws cloudformation describe-stack-events --stack-name "$STACK" \
  --output json > "artefacts/${STACK}-events.json" || true
aws cloudformation list-stack-resources --stack-name "$STACK" \
  --output json > "artefacts/${STACK}-resources.json" || true
