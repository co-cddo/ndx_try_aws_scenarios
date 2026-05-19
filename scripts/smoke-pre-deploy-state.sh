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

# The fixed-name LogGroup orphan sweep used to live here. It deleted LGs
# that CFN currently owned (between umbrella runs); the next CFN update
# then failed NotFound on those same resources. Rely on CFN's own cleanup
# instead (PowerUserAccess on the deploy role now allows logs:DeleteLogGroup).

STACK="${STACK_NAME}"

# Block until the stack reaches a terminal (non-IN_PROGRESS) state or the
# wait budget expires. Echoes the final status. Returns 0 on stable, 1 on
# timeout. We poll instead of using `aws cloudformation wait` because the
# all-demo umbrella's rollbacks routinely run past the CLI waiter's
# 60-poll * 30s = 30-minute budget.
wait_for_stable() {
  local stack="$1"
  local max_wait="${2:-3600}"
  local interval=30
  local elapsed=0
  local s
  while (( elapsed < max_wait )); do
    s=$(aws cloudformation describe-stacks --stack-name "$stack" \
        --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
    if [[ "$s" != *_IN_PROGRESS ]]; then
      echo "$s"
      return 0
    fi
    echo "  $stack still $s (${elapsed}s elapsed, max ${max_wait}s)" >&2
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "$s"
  return 1
}

# Sweep CFN stacks whose name starts with "${STACK}-" — both retained nested
# stacks left over from delete-with-retain (all-demo-PaperlessNgx-*) and any
# previous recovery stacks (all-demo-recovery-*). These orphans still own
# globally-unique resources (AppRegistryApplication names in particular) and
# block the next umbrella's creation of the same child. Best-effort: any
# orphan that ends in DELETE_FAILED gets retained-and-issued for triage so
# the deploy can proceed.
sweep_orphan_stacks() {
  local orphans orphan orph_status orph_retain
  orphans=$(aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE DELETE_FAILED UPDATE_ROLLBACK_FAILED CREATE_FAILED UPDATE_FAILED ROLLBACK_COMPLETE \
    --query "StackSummaries[?starts_with(StackName, \`${STACK}-\`)].StackName" \
    --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
  [ -z "$orphans" ] && { echo "No orphan ${STACK}-* stacks to sweep."; return 0; }
  echo "Orphan stacks to sweep:"
  echo "$orphans"
  while IFS= read -r orphan; do
    [ -z "$orphan" ] && continue
    echo "  deleting orphan: $orphan"
    aws cloudformation delete-stack --stack-name "$orphan" || true
    if ! orph_status=$(wait_for_stable "$orphan" 1800); then
      gh issue create --title "smoke: orphan $orphan delete timed out" \
        --label stranded-stack \
        --body "Run ${GITHUB_RUN_ID} couldn't clean up $orphan within 30m." || true
      continue
    fi
    if [ "$orph_status" = "DELETE_FAILED" ]; then
      orph_retain=$(aws cloudformation list-stack-resources --stack-name "$orphan" \
        --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
        --output text | tr '\t' ' ')
      if [ -n "$orph_retain" ]; then
        echo "  retrying orphan delete retaining: $orph_retain"
        # shellcheck disable=SC2086
        aws cloudformation delete-stack --stack-name "$orphan" \
          --retain-resources $orph_retain || true
        wait_for_stable "$orphan" 1800 || true
        gh issue create --title "smoke: $orphan retained resources" \
          --label stranded-stack \
          --body "Retained on orphan delete: $orph_retain. Run ${GITHUB_RUN_ID}." || true
      fi
    fi
  done <<< "$orphans"
}

# All "use the canonical stack name" exit paths funnel through here so that
# orphan sweep runs exactly once, just before the deploy step reads the
# output. Recovery exit paths (emit_recovery) skip this; an orphan's
# resource conflict against a recovery name is rare in practice.
use_canonical() {
  sweep_orphan_stacks
  echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
}

emit_recovery() {
  local reason="$1"
  local recovery="${STACK}-recovery-${GITHUB_RUN_ID}"
  echo "stack_name=$recovery" >> "$GITHUB_OUTPUT"
  gh issue create --title "stranded-stack: $STACK ($reason)" \
    --label stranded-stack \
    --body "Run ${GITHUB_RUN_ID} proceeded against recovery name $recovery. Manual cleanup needed." || true
}

STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK" \
  --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
echo "Current $STACK status: $STATUS"

case "$STATUS" in
  DOES_NOT_EXIST|CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
    use_canonical
    ;;
  CREATE_FAILED|UPDATE_FAILED)
    # Fix-forward: CFN's `update-stack` (which `aws cloudformation deploy`
    # uses) accepts both *_FAILED states and replaces failed resources without
    # touching the healthy ones. Reaching these states means at least one
    # leaf resource failed outright but the umbrella rollback couldn't run to
    # completion — we let the next deploy retry the leaves.
    echo "Fix-forwarding from $STATUS"
    use_canonical
    ;;
  ROLLBACK_COMPLETE)
    # CFN refuses updates on ROLLBACK_COMPLETE (initial CREATE rolled back).
    # Delete + recreate is the only option.
    aws cloudformation delete-stack --stack-name "$STACK"
    if aws cloudformation wait stack-delete-complete --stack-name "$STACK"; then
      use_canonical
    else
      emit_recovery "delete from ROLLBACK_COMPLETE failed"
    fi
    ;;
  *_IN_PROGRESS)
    # cancel-update-stack only works on UPDATE_IN_PROGRESS; CFN refuses on
    # the cleanup or rollback variants. Either way we wait for whatever is
    # in flight to finish before deciding next steps.
    case "$STATUS" in
      UPDATE_IN_PROGRESS)
        aws cloudformation cancel-update-stack --stack-name "$STACK" 2>/dev/null || true
        ;;
    esac
    if STATUS_NOW=$(wait_for_stable "$STACK" 3600); then
      echo "Reached stable state: $STATUS_NOW"
      use_canonical
    else
      emit_recovery "stuck in $STATUS_NOW after 60m wait"
    fi
    ;;
  UPDATE_ROLLBACK_FAILED)
    # continue-update-rollback is async — without a wait, the deploy step
    # races straight back into the rollback and fails the changeset call.
    # If the first attempt lands back in UPDATE_ROLLBACK_FAILED, one or
    # more leaf resources are stuck in UPDATE_FAILED in a way CFN can't
    # un-do (nested stacks where the same dependency keeps failing, Wisdom
    # resources rejecting UPDATE, etc.); the second attempt skips them so
    # the umbrella can at least reach UPDATE_ROLLBACK_COMPLETE and accept
    # a fresh deploy. If even the skip-retry can't unstick, we fall through
    # to delete-stack so the umbrella's globally-unique child resources
    # (AppRegistryApplication etc.) get freed for the next create.
    aws cloudformation continue-update-rollback --stack-name "$STACK" || true
    STATUS_NOW=$(wait_for_stable "$STACK" 3600) || {
      emit_recovery "continue-update-rollback still running after 60m"
      exit 0
    }
    echo "Reached stable state after continue-update-rollback: $STATUS_NOW"
    if [ "$STATUS_NOW" = "UPDATE_ROLLBACK_FAILED" ]; then
      SKIP=$(aws cloudformation list-stack-resources --stack-name "$STACK" \
        --query 'StackResourceSummaries[?ResourceStatus==`UPDATE_FAILED`].LogicalResourceId' \
        --output text | tr '\t' ' ')
      if [ -n "$SKIP" ]; then
        echo "Retrying continue-update-rollback skipping: $SKIP"
        # shellcheck disable=SC2086 # word-splitting required to pass multiple ids
        aws cloudformation continue-update-rollback --stack-name "$STACK" \
          --resources-to-skip $SKIP || true
        STATUS_NOW=$(wait_for_stable "$STACK" 3600) || {
          emit_recovery "rollback retry-with-skip still running after 60m"
          exit 0
        }
        echo "After skip retry: $STATUS_NOW"
      fi
    fi
    if [ "$STATUS_NOW" = "UPDATE_ROLLBACK_FAILED" ]; then
      echo "Rollback unrecoverable; deleting $STACK"
      aws cloudformation delete-stack --stack-name "$STACK" || true
      STATUS_NOW=$(wait_for_stable "$STACK" 3600) || {
        emit_recovery "delete-stack still running after 60m"
        exit 0
      }
      if [ "$STATUS_NOW" = "DELETE_FAILED" ]; then
        RETAIN=$(aws cloudformation list-stack-resources --stack-name "$STACK" \
          --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
          --output text | tr '\t' ' ')
        if [ -n "$RETAIN" ]; then
          echo "Retrying delete-stack retaining: $RETAIN"
          # shellcheck disable=SC2086 # word-splitting required to pass multiple ids
          aws cloudformation delete-stack --stack-name "$STACK" \
            --retain-resources $RETAIN || true
          STATUS_NOW=$(wait_for_stable "$STACK" 3600) || {
            emit_recovery "delete-stack-with-retain still running after 60m"
            exit 0
          }
          # Open a follow-up so the retained resources get cleaned up.
          gh issue create --title "smoke: retained resources after $STACK delete" \
            --label stranded-stack \
            --body "Retained on delete: $RETAIN. Run ${GITHUB_RUN_ID}." || true
        fi
      fi
      echo "Post-delete status: $STATUS_NOW"
    fi
    use_canonical
    ;;
  DELETE_FAILED)
    aws cloudformation delete-stack --stack-name "$STACK"
    if aws cloudformation wait stack-delete-complete --stack-name "$STACK"; then
      use_canonical
    else
      emit_recovery "DELETE_FAILED"
    fi
    ;;
  *)
    echo "Unhandled status $STATUS; proceeding with default name"
    use_canonical
    ;;
esac
