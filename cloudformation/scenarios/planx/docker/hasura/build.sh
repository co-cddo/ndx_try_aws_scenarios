#!/bin/bash
set -euo pipefail

# Build PlanX Hasura image with migrations, metadata, and demo seed data
# Usage: ./build.sh [--push ECR_URI]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR=$(mktemp -d)
PLANX_REPO="https://github.com/theopensystemslab/planx-new.git"
PLANX_COMMIT="${PLANX_COMMIT:-main}"

echo "==> Cloning PlanX Hasura resources (sparse checkout)..."
cd "$BUILD_DIR"
git init planx-hasura
cd planx-hasura
git remote add origin "$PLANX_REPO"
git config core.sparseCheckout true
cat > .git/info/sparse-checkout << 'EOF'
apps/hasura.planx.uk/migrations/
apps/hasura.planx.uk/metadata/
EOF
git pull --depth 1 origin "$PLANX_COMMIT"

echo "==> Copying migrations and metadata..."
cp -r apps/hasura.planx.uk/migrations "$BUILD_DIR/migrations"
cp -r apps/hasura.planx.uk/metadata "$BUILD_DIR/metadata"

echo "==> Copying seed data..."
mkdir -p "$BUILD_DIR/seed"
cp "$SCRIPT_DIR/seed/"*.sql "$BUILD_DIR/seed/" 2>/dev/null || true

echo "==> Copying Dockerfile..."
cp "$SCRIPT_DIR/Dockerfile" "$BUILD_DIR/Dockerfile"

echo "==> Building Docker image..."
cd "$BUILD_DIR"
docker build -t ndx-planx-hasura:latest .

if [ "${1:-}" = "--push" ] && [ -n "${2:-}" ]; then
  ECR_URI="$2"
  echo "==> Pushing to $ECR_URI..."
  docker tag ndx-planx-hasura:latest "$ECR_URI:latest"
  docker push "$ECR_URI:latest"
fi

echo "==> Cleaning up..."
rm -rf "$BUILD_DIR"

echo "==> Done! Image: ndx-planx-hasura:latest"
