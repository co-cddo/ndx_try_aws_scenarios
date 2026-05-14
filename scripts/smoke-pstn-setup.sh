#!/usr/bin/env bash
# One-shot: create a long-lived "holder" Connect instance and claim a UK
# geographic DID against it for ai-contact-centre smoke deploys to reuse.
#
# Idempotent on subsequent runs: reuses an existing instance with the holder
# alias, and skips claiming if a number is already attached.
#
# Outputs (printed AND written to $GITHUB_OUTPUT if set):
#   holder_instance_id
#   phone_number_arn
#   phone_number

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
HOLDER_ALIAS="${HOLDER_ALIAS:-ndx-smoke-pstn-holder}"

emit() {
  echo "$1=$2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "$1=$2" >> "$GITHUB_OUTPUT"
  fi
}

echo "=== Step 1: locate or create holder Connect instance ==="
HOLDER_ID=$(aws connect list-instances --region "$REGION" \
  --query "InstanceSummaryList[?InstanceAlias=='$HOLDER_ALIAS']|[0].Id" --output text 2>/dev/null)

if [ -z "$HOLDER_ID" ] || [ "$HOLDER_ID" = "None" ]; then
  echo "No holder instance found; creating '$HOLDER_ALIAS'..."
  HOLDER_ID=$(aws connect create-instance --region "$REGION" \
    --identity-management-type CONNECT_MANAGED \
    --instance-alias "$HOLDER_ALIAS" \
    --inbound-calls-enabled \
    --no-outbound-calls-enabled \
    --query 'Id' --output text)
  echo "Created: $HOLDER_ID"
else
  echo "Reusing existing holder: $HOLDER_ID"
fi

echo "=== Step 2: wait for ACTIVE ==="
for i in $(seq 1 30); do
  STATUS=$(aws connect describe-instance --region "$REGION" \
    --instance-id "$HOLDER_ID" --query 'Instance.InstanceStatus' --output text 2>/dev/null || echo "?")
  echo "  poll $i: $STATUS"
  [ "$STATUS" = "ACTIVE" ] && break
  sleep 10
done
[ "$STATUS" != "ACTIVE" ] && { echo "Instance never reached ACTIVE; bailing" >&2; exit 1; }

HOLDER_ARN=$(aws connect describe-instance --region "$REGION" \
  --instance-id "$HOLDER_ID" --query 'Instance.Arn' --output text)
echo "Holder ARN: $HOLDER_ARN"

echo "=== Step 3: check for already-claimed number ==="
EXISTING=$(aws connect list-phone-numbers-v2 --region "$REGION" \
  --target-arn "$HOLDER_ARN" \
  --query 'ListPhoneNumbersSummaryList[0].{Arn:PhoneNumberArn,Number:PhoneNumber}' \
  --output json 2>/dev/null || echo '{}')
EXISTING_ARN=$(echo "$EXISTING" | jq -r '.Arn // ""')
EXISTING_NUM=$(echo "$EXISTING" | jq -r '.Number // ""')

if [ -n "$EXISTING_ARN" ] && [ "$EXISTING_ARN" != "null" ]; then
  echo "Already have number $EXISTING_NUM ($EXISTING_ARN); reusing."
  emit "holder_instance_id" "$HOLDER_ID"
  emit "phone_number_arn"   "$EXISTING_ARN"
  emit "phone_number"       "$EXISTING_NUM"
  exit 0
fi

echo "=== Step 4: search for an available UK DID ==="
# Geographic 020 (London) first; fall back to other GB DID ranges.
# search-available-phone-numbers can't filter by prefix; we list and pick.
NUM=""
for type in DID; do
  CANDIDATES=$(aws connect search-available-phone-numbers --region "$REGION" \
    --target-arn "$HOLDER_ARN" \
    --phone-number-country-code GB \
    --phone-number-type "$type" \
    --max-results 25 \
    --query 'AvailableNumbersList[].PhoneNumber' --output text 2>/dev/null | tr '\t' '\n')
  # Prefer +4420 (London) → +4429, +4421, etc. Otherwise take the first.
  NUM=$(echo "$CANDIDATES" | grep -E '^\+4420' | head -1)
  [ -z "$NUM" ] && NUM=$(echo "$CANDIDATES" | head -1)
  [ -n "$NUM" ] && break
done
[ -z "$NUM" ] && { echo "No available UK numbers" >&2; exit 1; }
echo "Selected number: $NUM"

echo "=== Step 5: claim ==="
CLAIM=$(aws connect claim-phone-number --region "$REGION" \
  --target-arn "$HOLDER_ARN" \
  --phone-number "$NUM" \
  --query '{Arn:PhoneNumberArn,Id:PhoneNumberId}' --output json)
PHONE_ARN=$(echo "$CLAIM" | jq -r .Arn)
PHONE_ID=$(echo "$CLAIM" | jq -r .Id)
echo "Claimed: $PHONE_ARN (id $PHONE_ID)"

emit "holder_instance_id" "$HOLDER_ID"
emit "phone_number_arn"   "$PHONE_ARN"
emit "phone_number"       "$NUM"
