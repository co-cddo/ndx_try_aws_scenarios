#!/bin/bash
set -euo pipefail

# Build PlanX API image with demo auth overlay
# Usage: ./build.sh [--push ECR_URI]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR=$(mktemp -d)
PLANX_REPO="https://github.com/theopensystemslab/planx-new.git"
PLANX_COMMIT="${PLANX_COMMIT:-main}"

echo "==> Cloning PlanX monorepo (shallow)..."
git clone --depth 1 --branch "$PLANX_COMMIT" "$PLANX_REPO" "$BUILD_DIR/planx-src" 2>/dev/null || \
  git clone --depth 1 "$PLANX_REPO" "$BUILD_DIR/planx-src"

echo "==> Preparing build context..."
mkdir -p "$BUILD_DIR/overlays"
cp "$SCRIPT_DIR/overlays/demo-auth.js" "$BUILD_DIR/overlays/"
cp "$SCRIPT_DIR/Dockerfile" "$BUILD_DIR/Dockerfile"

# Move API app to expected location
mv "$BUILD_DIR/planx-src/apps/api.planx.uk" "$BUILD_DIR/planx-src/api.planx.uk"

echo "==> Building Docker image..."
cd "$BUILD_DIR"
docker build -t ndx-planx-api:latest .

if [ "${1:-}" = "--push" ] && [ -n "${2:-}" ]; then
  ECR_URI="$2"
  echo "==> Pushing to $ECR_URI..."
  docker tag ndx-planx-api:latest "$ECR_URI:latest"
  docker push "$ECR_URI:latest"
fi

echo "==> Cleaning up..."
rm -rf "$BUILD_DIR"

echo "==> Done! Image: ndx-planx-api:latest"
