#!/usr/bin/env bash
# Reconciles the smoke stack's current CFN state to a deployable starting point.
# Writes `stack_name=<name>` to $GITHUB_OUTPUT. If recovery isn't possible,
# returns a unique recovery name and opens a stranded-stack issue.
#
# Inputs (env):
#   STACK_NAME       canonical stack name (e.g. all-demo)
#   GITHUB_RUN_ID    used to build recovery names
#   GH_TOKEN         for gh issue create (optional; failures are tolerated)
#
# Outputs (appended to $GITHUB_OUTPUT):
#   stack_name=<original-or-recovery>

set -euo pipefail

# Sweep known LogGroup orphans from prior failed deploys before the stack
# state check. AWS::Logs::LogGroup with a fixed LogGroupName collides with
# the implicit one created by Lambda's first invocation; if the explicit
# CFN one fails to delete on rollback (or wasn't created because CFN raced),
# the orphan blocks the next deploy with "already exists". With fix-forward
# (--disable-rollback) the smoke pack relies on the same names being
# available run-to-run, so we proactively prune them here.
echo "Pruning known orphan LogGroups from prior runs..."
for lg in \
  '/ndx-bops/production' \
  '/aws/lambda/ndx-quicksight-data-generator-us-east-1' \
  '/aws/lambda/ndx-quicksight-setup-us-east-1' \
  '/aws/lambda/ndx-try-aicc-connect-bootstrap-us-east-1' \
  '/aws/lambda/ndx-try-aicc-seed-kb-us-east-1' \
  '/aws/lambda/ndx-try-chatbot-seed-data-us-east-1'; do
  aws logs delete-log-group --log-group-name "$lg" 2>/dev/null \
    && echo "  deleted: $lg" \
    || true
done

STACK="${STACK_NAME}"
STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK" \
  --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
echo "Current $STACK status: $STATUS"

emit_recovery() {
  local reason="$1"
  local recovery="${STACK}-recovery-${GITHUB_RUN_ID}"
  echo "stack_name=$recovery" >> "$GITHUB_OUTPUT"
  gh issue create --title "stranded-stack: $STACK ($reason)" \
    --label stranded-stack \
    --body "Run ${GITHUB_RUN_ID} proceeded against recovery name $recovery. Manual cleanup needed." || true
}

case "$STATUS" in
  DOES_NOT_EXIST|CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
    echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    ;;
  CREATE_FAILED|UPDATE_FAILED)
    # We deploy with --disable-rollback. On CREATE/UPDATE failure the stack
    # stays in *_FAILED with successful child stacks preserved. CFN's
    # update-stack works on both: it replaces failed resources without
    # rebuilding the healthy ones. The deploy step issues update-stack via
    # `aws cloudformation deploy` here — fix-forward.
    echo "Fix-forwarding from $STATUS (healthy children preserved)"
    echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    ;;
  ROLLBACK_COMPLETE)
    # Predates --disable-rollback; shouldn't occur going forward, but handle
    # historical state. CFN refuses updates on ROLLBACK_COMPLETE; delete +
    # recreate is the only option.
    aws cloudformation delete-stack --stack-name "$STACK"
    if aws cloudformation wait stack-delete-complete --stack-name "$STACK"; then
      echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    else
      emit_recovery "delete from ROLLBACK_COMPLETE failed"
    fi
    ;;
  *_IN_PROGRESS)
    case "$STATUS" in
      UPDATE_IN_PROGRESS|UPDATE_COMPLETE_CLEANUP_IN_PROGRESS|UPDATE_ROLLBACK_IN_PROGRESS)
        aws cloudformation cancel-update-stack --stack-name "$STACK" 2>/dev/null || true
        ;;
    esac
    sleep 60
    STATUS_NOW=$(aws cloudformation describe-stacks --stack-name "$STACK" \
      --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
    if [[ "$STATUS_NOW" =~ _IN_PROGRESS$ ]]; then
      emit_recovery "stuck in $STATUS_NOW"
    else
      echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    fi
    ;;
  UPDATE_ROLLBACK_FAILED)
    aws cloudformation continue-update-rollback --stack-name "$STACK" || true
    echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    ;;
  DELETE_FAILED)
    aws cloudformation delete-stack --stack-name "$STACK"
    if aws cloudformation wait stack-delete-complete --stack-name "$STACK"; then
      echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    else
      emit_recovery "DELETE_FAILED"
    fi
    ;;
  *)
    echo "Unhandled status $STATUS; proceeding with default name"
    echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
    ;;
esac
