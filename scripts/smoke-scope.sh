#!/usr/bin/env bash
# Decides which scenarios the current event should smoke.
# Writes to $GITHUB_OUTPUT:
#   mode=full|scoped|none
#   scenarios=<JSON array of scenario slugs>
#
# Full smoke fires on schedule / workflow_dispatch / push. PRs scope to the
# scenarios whose paths changed, except rails paths (shared fixtures, smoke
# runner, smoke.sh, playwright.config, all-demo template, smoke.yml itself,
# the smoke config / runbook, package.json) which force a full deploy.

set -euo pipefail

EVENT="${GITHUB_EVENT_NAME}"
BASE_REF="${GITHUB_BASE_REF:-}"

emit() {
  echo "mode=$1" >> "$GITHUB_OUTPUT"
  echo "scenarios=$2" >> "$GITHUB_OUTPUT"
}

if [ "$EVENT" = "schedule" ] || [ "$EVENT" = "workflow_dispatch" ] || [ "$EVENT" = "push" ]; then
  emit "full" '["all-demo"]'
  exit 0
fi

git fetch origin "$BASE_REF" --depth 1
CHANGED=$(git diff --name-only "origin/${BASE_REF}"...HEAD)
echo "Changed paths:"
echo "$CHANGED" | sed 's/^/  /'

RAILS_RE='^(scripts/(smoke[^.]*\.sh|check-quarantines\.mjs)|playwright\.config\.ts|tests/smoke/(runner|fixtures/)|cloudformation/scenarios/all-demo/|\.github/workflows/smoke\.yml|docs/smoke-test-account-(config\.yml|setup\.md)|package\.json)'
if echo "$CHANGED" | grep -qE "$RAILS_RE"; then
  echo "Rails change detected — full smoke"
  emit "full" '["all-demo"]'
  exit 0
fi

SCENARIOS=$(echo "$CHANGED" \
  | grep -oE 'cloudformation/scenarios/[a-z0-9-]+' \
  | sed -E 's#cloudformation/scenarios/##' \
  | grep -v -E '^all-demo$' \
  | sort -u || true)

if [ -z "$SCENARIOS" ]; then
  echo "No scenario paths changed — skipping smoke"
  emit "none" '[]'
  exit 0
fi

JSON=$(echo "$SCENARIOS" | jq -R . | jq -sc .)
echo "Scoped scenarios: $JSON"
emit "scoped" "$JSON"
