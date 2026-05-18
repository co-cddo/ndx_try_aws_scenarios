#!/usr/bin/env bash
# Fails if a sam-package output references any S3 bucket other than the
# blueprints bucket. SAM's default --s3-bucket would write CodeUri values
# pointing at aws-sam-cli-managed-default-samclisourcebucket-* which the
# smoke deploy role can't read.
#
# Args: <packaged-template-path> <expected-bucket-name>

set -euo pipefail

TEMPLATE="${1:?packaged template path required}"
EXPECTED="${2:?expected bucket name required}"

BAD=$(grep -oE 's3://[a-z0-9.-]+' "$TEMPLATE" | sort -u | grep -v "^s3://${EXPECTED}$" || true)
if [ -n "$BAD" ]; then
  echo "ERROR: packaged template references non-blueprints buckets:"
  echo "$BAD"
  echo ""
  echo "Re-check the sam package command's --s3-bucket flag."
  exit 1
fi
COUNT=$(grep -c "s3://${EXPECTED}" "$TEMPLATE" || true)
echo "Verified $COUNT CodeUri references point at the blueprints bucket"
