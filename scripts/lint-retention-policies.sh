#!/usr/bin/env bash
# Lints CloudFormation for resources that retain state through `cfn delete`.
# Orphaned retained resources require manual cleanup in the smoke account.
# Resources opt out via a non-empty Metadata.Justification; the global cap
# (MAX_JUSTIFICATIONS, default 5) keeps the opt-out from becoming routine.
#
# Targets:
#   - DeletionPolicy: Retain | Snapshot
#   - UpdateReplacePolicy: Retain | Snapshot
#   - Properties.DeletionProtection: true              (RDS / Aurora)
#   - Properties.FinalSnapshotIdentifier               (suppression equivalent)
#   - Properties.EnableDeletionProtection: true        (ELB, etc.)
#
# Usage:
#   scripts/lint-retention-policies.sh <template.yaml|template.json> [...]
#
# Exit codes:
#   0   all checks passed
#   1   one or more resources violated the lint
#   2   bad invocation (no inputs, missing jq)

set -euo pipefail

MAX_JUSTIFICATIONS="${MAX_JUSTIFICATIONS:-5}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

# yq (mikefarah/yq v4) is used to normalize real YAML templates to JSON. The
# script tolerates its absence as long as every input is JSON-in-YAML
# (synth-output) or pure JSON; raw YAML templates without yq fall through to
# a clear error rather than a silent miss.
HAS_YQ=0
if command -v yq >/dev/null 2>&1; then
  HAS_YQ=1
fi

if [ $# -eq 0 ]; then
  echo "Usage: $0 <template.json|template.yaml> [...]" >&2
  exit 2
fi

# Convert a template file to a single JSON document on stdout. Handles:
#   - pure JSON
#   - JSON-in-YAML (synth output; leading "# Auto-generated" line plus JSON body)
#   - real YAML (hand-authored templates; requires yq)
normalize_template() {
  local TEMPLATE="$1"
  # Strip leading comment lines and check the first non-comment character.
  local FIRST_CHAR
  FIRST_CHAR=$(grep -v '^[[:space:]]*#' "$TEMPLATE" | tr -d '[:space:]' | head -c 1)
  if [ "$FIRST_CHAR" = "{" ]; then
    grep -v '^[[:space:]]*#' "$TEMPLATE"
  elif [ "$HAS_YQ" -eq 1 ]; then
    yq eval -o json '.' "$TEMPLATE"
  else
    echo "ERROR: $TEMPLATE is real YAML and yq is not installed" >&2
    return 1
  fi
}

EXIT=0
TOTAL_JUSTIFICATIONS=0
FAILED_RESOURCES=()
JUSTIFIED_RESOURCES=()

for TEMPLATE in "$@"; do
  if [ ! -f "$TEMPLATE" ]; then
    echo "ERROR: $TEMPLATE does not exist" >&2
    EXIT=1
    continue
  fi

  # Normalize the template to JSON for jq processing.
  if ! CONTENT=$(normalize_template "$TEMPLATE"); then
    EXIT=1
    continue
  fi

  # Walk every resource. jq emits one line per offending resource as
  # "<logical-id>\t<retention-source>\t<has-justification>".
  while IFS=$'\t' read -r LOGICAL_ID SOURCE JUSTIFICATION; do
    [ -z "$LOGICAL_ID" ] && continue
    if [ "$JUSTIFICATION" = "absent" ]; then
      FAILED_RESOURCES+=("$TEMPLATE:$LOGICAL_ID ($SOURCE)")
    else
      JUSTIFIED_RESOURCES+=("$TEMPLATE:$LOGICAL_ID ($SOURCE) — $JUSTIFICATION")
      TOTAL_JUSTIFICATIONS=$((TOTAL_JUSTIFICATIONS + 1))
    fi
  done < <(echo "$CONTENT" | jq -r '
    .Resources // {} |
    to_entries[] |
    . as $r |
    [
      (if (.value.DeletionPolicy == "Retain") then "DeletionPolicy=Retain" else empty end),
      (if (.value.DeletionPolicy == "Snapshot") then "DeletionPolicy=Snapshot" else empty end),
      (if (.value.UpdateReplacePolicy == "Retain") then "UpdateReplacePolicy=Retain" else empty end),
      (if (.value.UpdateReplacePolicy == "Snapshot") then "UpdateReplacePolicy=Snapshot" else empty end),
      (if (.value.Properties.DeletionProtection == true) then "Properties.DeletionProtection=true" else empty end),
      (if (.value.Properties.EnableDeletionProtection == true) then "Properties.EnableDeletionProtection=true" else empty end),
      (if (.value.Properties.FinalSnapshotIdentifier != null and .value.Properties.FinalSnapshotIdentifier != "") then "Properties.FinalSnapshotIdentifier=set" else empty end)
    ] as $sources |
    if ($sources | length) == 0 then empty
    else
      ($r.value.Metadata.Justification // "") as $just |
      [
        $r.key,
        ($sources | join(", ")),
        (if ($just != "") then $just else "absent" end)
      ] |
      @tsv
    end
  ')

  # Also enforce: no AssetParameters / cdk-bootstrap residue (the existing
  # synth-time check moves here so all checks live in one place).
  if echo "$CONTENT" | jq -e '.Parameters // {} | keys[] | select(startswith("AssetParameters"))' >/dev/null 2>&1; then
    FAILED_RESOURCES+=("$TEMPLATE:<top-level> (AssetParameters left in synthesized template)")
  fi

  if echo "$CONTENT" | grep -q 'cdk-bootstrap'; then
    FAILED_RESOURCES+=("$TEMPLATE:<top-level> (cdk-bootstrap reference left in synthesized template)")
  fi

  # Size check: CloudFormation S3-template hard limit is 1MB but the
  # blueprints bucket convention is < 400KB to stay nestable in StackSets.
  SIZE=$(wc -c <"$TEMPLATE")
  if [ "$SIZE" -gt 460800 ]; then
    FAILED_RESOURCES+=("$TEMPLATE:<top-level> (template size $SIZE bytes exceeds CFN limit 460800)")
  fi
done

if [ ${#FAILED_RESOURCES[@]} -gt 0 ]; then
  echo "RETENTION-LINT FAILURE:" >&2
  for R in "${FAILED_RESOURCES[@]}"; do
    echo "  - $R" >&2
  done
  echo "" >&2
  echo "To fix: either change the resource to a destroy-on-delete shape, or add" >&2
  echo "Metadata.Justification: \"<non-empty reason>\" on the resource in the CDK" >&2
  echo "source. CDK pattern: resource.cfnResource.cfnOptions.metadata = { Justification: '...' }" >&2
  echo "Raw-CFN pattern: add a Metadata: { Justification: '...' } block alongside Properties." >&2
  EXIT=1
fi

if [ "$TOTAL_JUSTIFICATIONS" -gt "$MAX_JUSTIFICATIONS" ]; then
  echo "RETENTION-LINT FAILURE: total justified retentions = $TOTAL_JUSTIFICATIONS exceeds cap MAX_JUSTIFICATIONS=$MAX_JUSTIFICATIONS" >&2
  echo "Justifications must be a sparingly-used exception, not a routine bypass." >&2
  echo "Currently-justified resources:" >&2
  for R in "${JUSTIFIED_RESOURCES[@]}"; do
    echo "  - $R" >&2
  done
  EXIT=1
fi

if [ "$EXIT" -eq 0 ]; then
  if [ ${#JUSTIFIED_RESOURCES[@]} -gt 0 ]; then
    echo "Retention lint: OK ($TOTAL_JUSTIFICATIONS justified retention(s) within cap $MAX_JUSTIFICATIONS)"
    for R in "${JUSTIFIED_RESOURCES[@]}"; do
      echo "  - $R"
    done
  else
    echo "Retention lint: OK (no retained resources, no justifications needed)"
  fi
fi

exit "$EXIT"
