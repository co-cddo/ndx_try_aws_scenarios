#!/usr/bin/env bash
# Destructive cleanup of the smoke account. Deletes:
#   - ${STACK_NAME} umbrella + every ${STACK_NAME}-* stack (top-level or nested)
#   - All AWS::S3Files::FileSystem (with access points + mount targets first)
#   - All ndx-try-*${ACCOUNT_ID}* S3 buckets (versioned-safe empty + delete)
#   - All NDXTry_* AppRegistry applications
#   - All ndx-try-* Amazon Connect instance aliases
#
# Re-uses helpers from smoke-pre-deploy-state.sh so the logic stays in one
# place. Runs under the smoke-test-deploy role via the GH Actions wrapper
# workflow.

set -euo pipefail

STACK="${STACK_NAME:?STACK_NAME required}"

# Source the pre-deploy helpers (wait_for_stable, cleanup_orphan,
# delete_bucket_completely, sweep_orphan_*, etc.). The pre-deploy script
# normally runs end-to-end on its own, but we only want the helpers, so
# `return 0` before its main case statement to short-circuit execution.
# Hacky: set a sentinel env var the source script checks, OR just inline
# the helpers we need. The latter is simpler and keeps this script
# self-contained.

# ── helpers (kept in sync with smoke-pre-deploy-state.sh) ─────────────

wait_for_stable() {
  local stack="$1" max_wait="${2:-3600}" interval=30 elapsed=0 s
  while (( elapsed < max_wait )); do
    s=$(aws cloudformation describe-stacks --stack-name "$stack" \
        --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DOES_NOT_EXIST")
    if [[ "$s" != *_IN_PROGRESS ]]; then
      echo "$s"; return 0
    fi
    echo "  $stack still $s (${elapsed}s elapsed, max ${max_wait}s)" >&2
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  echo "$s"; return 1
}

force_delete_stack() {
  local stack="$1" status retain remaining
  echo "deleting stack: $stack"
  aws cloudformation delete-stack --stack-name "$stack" 2>/dev/null || true
  status=$(wait_for_stable "$stack" 3600 || echo TIMEOUT)
  case "$status" in
    DELETE_COMPLETE|DOES_NOT_EXIST) return 0 ;;
  esac
  retain=$(aws cloudformation list-stack-resources --stack-name "$stack" \
    --query 'StackResourceSummaries[?ResourceStatus==`DELETE_FAILED`].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' ' ')
  if [ -n "$retain" ]; then
    echo "  retain-retry: $retain"
    # shellcheck disable=SC2086
    aws cloudformation delete-stack --stack-name "$stack" \
      --retain-resources $retain 2>/dev/null || true
    status=$(wait_for_stable "$stack" 3600 || echo TIMEOUT)
  fi
  case "$status" in
    DELETE_COMPLETE|DOES_NOT_EXIST) return 0 ;;
  esac
  remaining=$(aws cloudformation list-stack-resources --stack-name "$stack" \
    --query 'StackResourceSummaries[].LogicalResourceId' \
    --output text 2>/dev/null | tr '\t' ' ')
  if [ -n "$remaining" ]; then
    echo "  force-retain everything: $remaining"
    # shellcheck disable=SC2086
    aws cloudformation delete-stack --stack-name "$stack" \
      --retain-resources $remaining 2>/dev/null || true
    wait_for_stable "$stack" 1800 || true
  fi
}

delete_bucket_completely() {
  local bucket="$1" attempt versions markers rb_err del_payload del_err
  for attempt in 1 2 3; do
    versions=$(aws s3api list-object-versions --bucket "$bucket" --max-items 1000 \
      --query '{Objects: Versions[].{Key: Key, VersionId: VersionId}}' \
      --output json 2>/dev/null | jq -c '.Objects // []' || echo '[]')
    if [ "$versions" != "[]" ] && [ -n "$versions" ]; then
      del_payload=$(jq -n --argjson o "$versions" '{Objects: $o}')
      del_err=$(aws s3api delete-objects --bucket "$bucket" --delete "$del_payload" 2>&1) || true
      [ -n "$del_err" ] && echo "$del_err" | sed 's/^/    /'
    fi
    markers=$(aws s3api list-object-versions --bucket "$bucket" --max-items 1000 \
      --query '{Objects: DeleteMarkers[].{Key: Key, VersionId: VersionId}}' \
      --output json 2>/dev/null | jq -c '.Objects // []' || echo '[]')
    if [ "$markers" != "[]" ] && [ -n "$markers" ]; then
      del_payload=$(jq -n --argjson o "$markers" '{Objects: $o}')
      del_err=$(aws s3api delete-objects --bucket "$bucket" --delete "$del_payload" 2>&1) || true
      [ -n "$del_err" ] && echo "$del_err" | sed 's/^/    /'
    fi
    echo "  attempt $attempt: rb s3://$bucket --force"
    rb_err=$(aws s3 rb "s3://$bucket" --force 2>&1) || true
    if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
      echo "  $bucket deleted"; return 0
    fi
    echo "  $bucket still present after attempt $attempt; rb stderr: ${rb_err:-<empty>}"
    sleep 5
  done
  return 1
}

# ── phases ────────────────────────────────────────────────────────────

echo "============================================================"
echo "PHASE 1: delete CFN stacks matching ${STACK}*"
echo "============================================================"
# Top-level stacks named STACK or STACK-*: delete each.
# delete-stack on the umbrella cascades to nested children.
# All non-DELETE_COMPLETE states. The earlier filter missed
# UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS and the IMPORT_* family;
# `Q59CODQ417ER` / `1KFCREGSEO53T` were ghosts the nuke kept skipping.
# Listing every non-terminal-deleted state guarantees we see them.
top_stacks=$(aws cloudformation list-stacks \
  --stack-status-filter \
    CREATE_IN_PROGRESS CREATE_FAILED CREATE_COMPLETE \
    ROLLBACK_IN_PROGRESS ROLLBACK_FAILED ROLLBACK_COMPLETE \
    DELETE_IN_PROGRESS DELETE_FAILED \
    UPDATE_IN_PROGRESS UPDATE_COMPLETE_CLEANUP_IN_PROGRESS UPDATE_COMPLETE \
    UPDATE_FAILED \
    UPDATE_ROLLBACK_IN_PROGRESS UPDATE_ROLLBACK_FAILED \
    UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS UPDATE_ROLLBACK_COMPLETE \
    REVIEW_IN_PROGRESS \
    IMPORT_IN_PROGRESS IMPORT_COMPLETE \
    IMPORT_ROLLBACK_IN_PROGRESS IMPORT_ROLLBACK_FAILED IMPORT_ROLLBACK_COMPLETE \
  --query "StackSummaries[?StackName=='${STACK}' || starts_with(StackName, '${STACK}-')].StackName" \
  --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
if [ -z "$top_stacks" ]; then
  echo "(none in terminal states)"
else
  echo "Top-level stacks to delete:"
  echo "$top_stacks"
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    force_delete_stack "$s" || true
  done <<< "$top_stacks"
fi

# Wait for any in-progress matches to settle too.
in_progress=$(aws cloudformation list-stacks \
  --stack-status-filter CREATE_IN_PROGRESS UPDATE_IN_PROGRESS DELETE_IN_PROGRESS \
    ROLLBACK_IN_PROGRESS UPDATE_ROLLBACK_IN_PROGRESS UPDATE_COMPLETE_CLEANUP_IN_PROGRESS REVIEW_IN_PROGRESS \
  --query "StackSummaries[?StackName=='${STACK}' || starts_with(StackName, '${STACK}-')].StackName" \
  --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
if [ -n "$in_progress" ]; then
  echo "Waiting for in-progress matches to settle:"
  echo "$in_progress"
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    wait_for_stable "$s" 3600 >/dev/null || echo "  $s timeout, moving on"
    # After stable, try delete again
    force_delete_stack "$s" || true
  done <<< "$in_progress"
fi

echo
echo "============================================================"
echo "PHASE 2: delete AWS::S3Files::FileSystem instances"
echo "============================================================"
# All FS in the account; access points → mount targets → file system.
fs_list=$(aws s3files list-file-systems --max-results 100 \
  --query 'fileSystems[].fileSystemId' --output text 2>/dev/null \
  | tr '\t' '\n' | grep -v '^$' || true)
if [ -z "$fs_list" ]; then
  echo "(none)"
else
  while IFS= read -r fs; do
    [ -z "$fs" ] && continue
    echo "File system: $fs"
    aps=$(aws s3files list-access-points --file-system-id "$fs" \
      --query 'accessPoints[].accessPointId' --output text 2>/dev/null \
      | tr '\t' '\n' | grep -v '^$' || true)
    if [ -n "$aps" ]; then
      while IFS= read -r ap; do
        [ -z "$ap" ] && continue
        echo "  delete access point: $ap"
        aws s3files delete-access-point --access-point-id "$ap" 2>&1 | sed 's/^/    /' || true
      done <<< "$aps"
      sleep 30
    fi
    mts=$(aws s3files list-mount-targets --file-system-id "$fs" \
      --query 'mountTargets[].mountTargetId' --output text 2>/dev/null \
      | tr '\t' '\n' | grep -v '^$' || true)
    if [ -n "$mts" ]; then
      while IFS= read -r mt; do
        [ -z "$mt" ] && continue
        echo "  delete mount target: $mt"
        aws s3files delete-mount-target --mount-target-id "$mt" 2>&1 | sed 's/^/    /' || true
      done <<< "$mts"
      sleep 60
    fi
    echo "  delete file system: $fs"
    aws s3files delete-file-system --file-system-id "$fs" --force-delete 2>&1 | sed 's/^/    /' || true
  done <<< "$fs_list"
  sleep 60
fi

echo
echo "============================================================"
echo "PHASE 3: delete NDXTry_* AppRegistry applications"
echo "============================================================"
apps=$(aws servicecatalog-appregistry list-applications \
  --query "applications[?starts_with(name, 'NDXTry_')].name" \
  --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
if [ -z "$apps" ]; then
  echo "(none)"
else
  while IFS= read -r app; do
    [ -z "$app" ] && continue
    # AppRegistry refuses delete while resources are associated.
    # Disassociate every resource type listed under the app, then delete.
    echo "disassociating resources for: $app"
    assoc=$(aws servicecatalog-appregistry list-associated-resources \
      --application "$app" \
      --query 'resources[].[arn,resourceType]' \
      --output text 2>/dev/null | grep -v '^$' || true)
    if [ -n "$assoc" ]; then
      while IFS=$'\t' read -r arn rtype; do
        [ -z "$arn" ] && continue
        echo "  disassociate $rtype: $arn"
        aws servicecatalog-appregistry disassociate-resource \
          --application "$app" --resource-type "$rtype" --resource "$arn" \
          2>&1 | sed 's/^/    /' || true
      done <<< "$assoc"
    fi
    echo "delete appregistry: $app"
    aws servicecatalog-appregistry delete-application --application "$app" 2>&1 | sed 's/^/    /' || true
  done <<< "$apps"
  sleep 30
fi

echo
echo "============================================================"
echo "PHASE 4: delete ndx-try-* Amazon Connect instances"
echo "============================================================"
instances=$(aws connect list-instances \
  --query "InstanceSummaryList[?starts_with(InstanceAlias, 'ndx-try-')].[Id,InstanceAlias]" \
  --output text 2>/dev/null | grep -v '^$' || true)
if [ -z "$instances" ]; then
  echo "(none)"
else
  while IFS=$'\t' read -r inst alias; do
    [ -z "$inst" ] && continue
    echo "delete connect: $alias ($inst)"
    aws connect delete-instance --instance-id "$inst" 2>&1 | sed 's/^/    /' || true
  done <<< "$instances"
fi

echo
echo "============================================================"
echo "PHASE 5: delete ndx-try-*\${ACCOUNT_ID}* S3 buckets"
echo "============================================================"
acct=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
buckets=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name, 'ndx-try-') && contains(Name, '${acct}')].Name" \
  --output text 2>/dev/null | tr '\t' '\n' | grep -v '^$' || true)
if [ -z "$buckets" ]; then
  echo "(none)"
else
  echo "Buckets to delete:"
  echo "$buckets"
  while IFS= read -r b; do
    [ -z "$b" ] && continue
    delete_bucket_completely "$b" || true
  done <<< "$buckets"
fi

echo
echo "============================================================"
echo "DONE. Smoke account should now be in a clean slate."
echo "============================================================"
