#!/usr/bin/env bash
# Tears the smoke stack down with up to 3 retries; opens a stranded-stack
# issue if all attempts fail.
#
# Inputs (env):
#   STACK            stack to delete
#   GITHUB_RUN_ID    used in the stranded-stack issue body
#   GH_TOKEN         for gh CLI

set +e
if [ -z "${STACK:-}" ]; then
  echo "No stack name resolved; nothing to tear down"
  exit 0
fi

for ATTEMPT in 1 2 3; do
  echo "Teardown attempt $ATTEMPT for $STACK"
  aws cloudformation delete-stack --stack-name "$STACK"
  if aws cloudformation wait stack-delete-complete --stack-name "$STACK"; then
    echo "Teardown succeeded"
    exit 0
  fi
  sleep 60
done

gh issue create --title "stranded-stack: $STACK DELETE_FAILED after teardown retry" \
  --label stranded-stack \
  --body "Stack $STACK failed delete after 3 attempts in run ${GITHUB_RUN_ID}. See artefacts for events." || true
