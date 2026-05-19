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
MAX_ITER=8

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

# Force-cleanup one orphan stack. First plain delete, wait. If timed out
# or DELETE_FAILED, retry with --retain-resources on whatever's stuck.
# If a second pass also can't complete, retain ALL remaining resources
# so the stack at least leaves CFN's tracking — debris on the account is
# acceptable to unblock the umbrella; we log a stranded-stack issue so
# humans can sweep later.
cleanup_orphan() {
  local orphan="$1"
  local status retain remaining
  echo "  deleting orphan: $orphan"
  aws cloudformation delete-stack --stack-name "$orphan" 2>/dev/null || true
  status=$(wait_for_stable "$orphan" 3600 || echo "TIMEOUT")
  case "$status" in
    DELETE_COMPLETE|DOES_NOT_EXIST)
      return 0
      ;;
  esac

  retain=$(aws cloudformation list-stack-resources --stack-name "$orphan" \
    --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' ' ')
  if [ -n "$retain" ]; then
    echo "  retrying orphan delete retaining: $retain"
    # shellcheck disable=SC2086
    aws cloudformation delete-stack --stack-name "$orphan" \
      --retain-resources $retain 2>/dev/null || true
    status=$(wait_for_stable "$orphan" 3600 || echo "TIMEOUT")
  fi

  case "$status" in
    DELETE_COMPLETE|DOES_NOT_EXIST)
      gh issue create --title "smoke: $orphan retained resources" \
        --label stranded-stack \
        --body "Retained on orphan delete: $retain. Run ${GITHUB_RUN_ID}." || true
      return 0
      ;;
  esac

  # Last resort: retain literally every remaining resource so the stack
  # disappears from CFN's tracking. Account debris is the lesser evil
  # vs. the umbrella's child stacks colliding on globally-unique names.
  remaining=$(aws cloudformation list-stack-resources --stack-name "$orphan" \
    --query 'StackResourceSummaries[].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' ' ')
  if [ -n "$remaining" ]; then
    echo "  forcing orphan delete by retaining everything: $remaining"
    # shellcheck disable=SC2086
    aws cloudformation delete-stack --stack-name "$orphan" \
      --retain-resources $remaining 2>/dev/null || true
    wait_for_stable "$orphan" 1800 || true
    gh issue create --title "smoke: $orphan force-retained all resources" \
      --label stranded-stack \
      --body "All resources retained on force-delete: $remaining. Run ${GITHUB_RUN_ID}." || true
  fi
}

# Sweep CFN stacks whose name starts with "${STACK}-" — both retained nested
# stacks left over from delete-with-retain (all-demo-PaperlessNgx-*) and any
# previous recovery stacks (all-demo-recovery-*).
sweep_orphan_stacks() {
  local orphans orphan
  orphans=$(aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE DELETE_FAILED UPDATE_ROLLBACK_FAILED CREATE_FAILED UPDATE_FAILED ROLLBACK_COMPLETE ROLLBACK_FAILED \
    --query "StackSummaries[?starts_with(StackName, \`${STACK}-\`)].StackName" \
    --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
  [ -z "$orphans" ] && { echo "No orphan ${STACK}-* stacks to sweep."; return 0; }
  echo "Orphan stacks to sweep:"
  echo "$orphans"
  while IFS= read -r orphan; do
    [ -z "$orphan" ] && continue
    cleanup_orphan "$orphan"
  done <<< "$orphans"
}

# Empty and delete S3 buckets matching ndx-try-*${ACCOUNT_ID}*. Force-retain
# orphan stack cleanups leave their non-stack-owned children behind, and
# scenario templates use deterministic bucket names with the account id in
# the suffix (e.g. ndx-try-planning-docs-<acct>-<region>). The next umbrella
# create then trips on AlreadyExists. Only call when the umbrella is truly
# absent from CFN (status=DOES_NOT_EXIST) so we can't accidentally delete a
# bucket that an in-flight stack still owns.
sweep_orphan_s3_buckets() {
  local acct buckets bucket
  acct=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || return 0
  # JMESPath backtick-literals parse their contents as JSON, so a bare
  # 12-digit account id becomes a number — and `contains(Name, <number>)`
  # never matches the string bucket names. Single-quoted JMESPath strings
  # avoid the parse and behave intuitively.
  buckets=$(aws s3api list-buckets \
    --query "Buckets[?starts_with(Name, 'ndx-try-') && contains(Name, '${acct}')].Name" \
    --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
  [ -z "$buckets" ] && { echo "No ndx-try-*${acct}* buckets to sweep."; return 0; }
  echo "S3 buckets to sweep:"
  echo "$buckets"
  while IFS= read -r bucket; do
    [ -z "$bucket" ] && continue
    echo "  emptying + deleting bucket: $bucket"
    # `aws s3 rb --force` handles non-versioned buckets. Versioned buckets
    # need delete-object-versions first; --force does not enumerate versions.
    aws s3api delete-objects --bucket "$bucket" \
      --delete "Objects=$(aws s3api list-object-versions --bucket "$bucket" \
        --query '{Objects: Versions[].{Key: Key, VersionId: VersionId}}' \
        --output json 2>/dev/null | jq -c '.Objects // []')" 2>/dev/null || true
    aws s3api delete-objects --bucket "$bucket" \
      --delete "Objects=$(aws s3api list-object-versions --bucket "$bucket" \
        --query '{Objects: DeleteMarkers[].{Key: Key, VersionId: VersionId}}' \
        --output json 2>/dev/null | jq -c '.Objects // []')" 2>/dev/null || true
    aws s3 rb "s3://$bucket" --force 2>/dev/null || \
      gh issue create --title "smoke: bucket $bucket couldn't be deleted" \
        --label stranded-stack \
        --body "Pre-deploy sweep on run ${GITHUB_RUN_ID} could not delete $bucket." || true
  done <<< "$buckets"
}

# Delete ServiceCatalog AppRegistry applications matching NDXTry_*. Same
# orphan story as buckets: scenario templates create AppRegistry apps with
# deterministic names; survivors block the next create.
sweep_orphan_appregistry() {
  local apps app
  apps=$(aws servicecatalog-appregistry list-applications \
    --query "applications[?starts_with(name, 'NDXTry_')].name" \
    --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
  [ -z "$apps" ] && { echo "No NDXTry_* AppRegistry apps to sweep."; return 0; }
  echo "AppRegistry apps to sweep:"
  echo "$apps"
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    echo "  deleting appregistry: $app"
    aws servicecatalog-appregistry delete-application --application "$app" 2>/dev/null || \
      gh issue create --title "smoke: appregistry $app couldn't be deleted" \
        --label stranded-stack \
        --body "Pre-deploy sweep on run ${GITHUB_RUN_ID} could not delete $app." || true
  done <<< "$apps"
}

# Final exit path for "use the canonical stack name". Sweeps orphans (so
# any nested-stack children left over from prior runs don't collide on
# globally-unique resource names) and writes the GH Actions output.
# Resource-level sweeps (S3 / AppRegistry) only fire when the umbrella is
# truly gone — running them while CFN is mid-create would yank live state
# out from under the stack.
use_canonical() {
  sweep_orphan_stacks
  if [ "$(aws cloudformation describe-stacks --stack-name "$STACK" \
        --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo DOES_NOT_EXIST)" = "DOES_NOT_EXIST" ]; then
    sweep_orphan_s3_buckets
    sweep_orphan_appregistry
  fi
  echo "stack_name=$STACK" >> "$GITHUB_OUTPUT"
  exit 0
}

emit_recovery() {
  local reason="$1"
  local recovery="${STACK}-recovery-${GITHUB_RUN_ID}"
  echo "stack_name=$recovery" >> "$GITHUB_OUTPUT"
  gh issue create --title "stranded-stack: $STACK ($reason)" \
    --label stranded-stack \
    --body "Run ${GITHUB_RUN_ID} proceeded against recovery name $recovery. Manual cleanup needed." || true
  exit 0
}

# Re-evaluating loop: any time a state-handling branch performs a wait or
# CFN-mutating call, we `continue` and re-read the stack's status. This
# lets transitions like ROLLBACK_IN_PROGRESS → ROLLBACK_COMPLETE be
# handled by the appropriate branch (delete + recreate) on the next
# iteration, instead of falling through to use_canonical with a status
# that isn't actually deployable.
for ITER in $(seq 1 $MAX_ITER); do
  STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
  echo "[iter ${ITER}/${MAX_ITER}] $STACK status: $STATUS"

  case "$STATUS" in
    DOES_NOT_EXIST|CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
      use_canonical
      ;;
    CREATE_FAILED|UPDATE_FAILED)
      # Fix-forward: CFN's `update-stack` (which `aws cloudformation deploy`
      # uses) accepts both *_FAILED states and replaces failed resources
      # without touching the healthy ones.
      echo "Fix-forwarding from $STATUS"
      use_canonical
      ;;
    ROLLBACK_COMPLETE)
      # CFN refuses updates on ROLLBACK_COMPLETE (initial CREATE rolled back).
      # Delete + recreate is the only option.
      echo "Deleting from ROLLBACK_COMPLETE"
      aws cloudformation delete-stack --stack-name "$STACK" || true
      wait_for_stable "$STACK" 3600 || emit_recovery "delete from ROLLBACK_COMPLETE timed out"
      continue
      ;;
    *_IN_PROGRESS)
      case "$STATUS" in
        UPDATE_IN_PROGRESS)
          # cancel-update-stack only works on UPDATE_IN_PROGRESS; CFN refuses
          # on the cleanup or rollback variants.
          aws cloudformation cancel-update-stack --stack-name "$STACK" 2>/dev/null || true
          ;;
      esac
      wait_for_stable "$STACK" 3600 || emit_recovery "stuck in $STATUS after 60m wait"
      continue
      ;;
    UPDATE_ROLLBACK_FAILED)
      # continue-update-rollback is async; on the first attempt CFN retries
      # the same failing leaves. If they fail again we re-issue with
      # --resources-to-skip on those leaves. If THAT still ends in
      # UPDATE_ROLLBACK_FAILED, fall through to delete-stack so the
      # umbrella's globally-unique child resources (AppRegistryApplication
      # etc.) get freed for the next create.
      echo "Attempting continue-update-rollback"
      aws cloudformation continue-update-rollback --stack-name "$STACK" 2>/dev/null || true
      STATUS_NOW=$(wait_for_stable "$STACK" 3600) || \
        emit_recovery "continue-update-rollback still running after 60m"
      if [ "$STATUS_NOW" = "UPDATE_ROLLBACK_FAILED" ]; then
        SKIP=$(aws cloudformation list-stack-resources --stack-name "$STACK" \
          --query 'StackResourceSummaries[?ResourceStatus==`UPDATE_FAILED`].LogicalResourceId' \
          --output text | tr '\t' ' ')
        if [ -n "$SKIP" ]; then
          echo "Retrying continue-update-rollback skipping: $SKIP"
          # shellcheck disable=SC2086
          aws cloudformation continue-update-rollback --stack-name "$STACK" \
            --resources-to-skip $SKIP 2>/dev/null || true
          STATUS_NOW=$(wait_for_stable "$STACK" 3600) || \
            emit_recovery "rollback retry-with-skip still running after 60m"
        fi
      fi
      if [ "$STATUS_NOW" = "UPDATE_ROLLBACK_FAILED" ]; then
        echo "Rollback unrecoverable; deleting $STACK"
        aws cloudformation delete-stack --stack-name "$STACK" 2>/dev/null || true
        STATUS_NOW=$(wait_for_stable "$STACK" 3600) || \
          emit_recovery "delete-stack still running after 60m"
        if [ "$STATUS_NOW" = "DELETE_FAILED" ]; then
          RETAIN=$(aws cloudformation list-stack-resources --stack-name "$STACK" \
            --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
            --output text | tr '\t' ' ')
          if [ -n "$RETAIN" ]; then
            echo "Retrying delete-stack retaining: $RETAIN"
            # shellcheck disable=SC2086
            aws cloudformation delete-stack --stack-name "$STACK" \
              --retain-resources $RETAIN 2>/dev/null || true
            wait_for_stable "$STACK" 3600 || \
              emit_recovery "delete-stack-with-retain still running after 60m"
            gh issue create --title "smoke: retained resources after $STACK delete" \
              --label stranded-stack \
              --body "Retained on delete: $RETAIN. Run ${GITHUB_RUN_ID}." || true
          fi
        fi
      fi
      continue
      ;;
    DELETE_FAILED)
      aws cloudformation delete-stack --stack-name "$STACK" 2>/dev/null || true
      STATUS_NOW=$(wait_for_stable "$STACK" 3600) || \
        emit_recovery "delete from DELETE_FAILED still running after 60m"
      if [ "$STATUS_NOW" = "DELETE_FAILED" ]; then
        RETAIN=$(aws cloudformation list-stack-resources --stack-name "$STACK" \
          --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
          --output text | tr '\t' ' ')
        if [ -n "$RETAIN" ]; then
          echo "Retrying delete-stack from DELETE_FAILED retaining: $RETAIN"
          # shellcheck disable=SC2086
          aws cloudformation delete-stack --stack-name "$STACK" \
            --retain-resources $RETAIN 2>/dev/null || true
          wait_for_stable "$STACK" 3600 || \
            emit_recovery "DELETE_FAILED-with-retain still running after 60m"
          gh issue create --title "smoke: retained resources after $STACK delete (DELETE_FAILED)" \
            --label stranded-stack \
            --body "Retained on delete: $RETAIN. Run ${GITHUB_RUN_ID}." || true
        fi
      fi
      continue
      ;;
    ROLLBACK_FAILED)
      # Rare: CREATE rolled back but rollback itself failed. Same shape as
      # UPDATE_ROLLBACK_FAILED — try continue-update-rollback then delete.
      echo "Attempting continue-update-rollback from ROLLBACK_FAILED"
      aws cloudformation continue-update-rollback --stack-name "$STACK" 2>/dev/null || true
      wait_for_stable "$STACK" 3600 || \
        emit_recovery "continue-rollback from ROLLBACK_FAILED timed out"
      continue
      ;;
    *)
      echo "Unhandled status $STATUS; proceeding with canonical name"
      use_canonical
      ;;
  esac
done

emit_recovery "exhausted ${MAX_ITER} iterations of state reconciliation"
