#!/usr/bin/env bash
# Captures stack events + resource list to artefacts/, recursing into nested
# stacks so a nested failure is diagnosable from the bundle alone.
# Failure-tolerant: captured state is more useful than nothing on partial deploys.
#
# Inputs (env):
#   STACK   name of the root stack to query

set -euo pipefail

mkdir -p artefacts
if [ -z "${STACK:-}" ]; then
  echo "No stack name resolved; skipping events capture"
  exit 0
fi

capture() {
  local stack="$1"
  local safe="${stack//\//_}"
  aws cloudformation describe-stack-events --stack-name "$stack" \
    --output json > "artefacts/${safe}-events.json" || true
  aws cloudformation list-stack-resources --stack-name "$stack" \
    --output json > "artefacts/${safe}-resources.json" || true
  # Recurse into nested stacks
  aws cloudformation list-stack-resources --stack-name "$stack" \
    --query 'StackResourceSummaries[?ResourceType==`AWS::CloudFormation::Stack`].PhysicalResourceId' \
    --output text 2>/dev/null | tr '\t' '\n' | while read -r nested; do
      [ -z "$nested" ] && continue
      capture "$nested"
    done
}

capture "$STACK"
