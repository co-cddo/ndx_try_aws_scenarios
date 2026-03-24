#!/bin/bash
set -euo pipefail

# Build PlanX ShareDB image
# Usage: ./build.sh [--push ECR_URI]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR=$(mktemp -d)
PLANX_REPO="https://github.com/theopensystemslab/planx-new.git"
PLANX_COMMIT="${PLANX_COMMIT:-main}"

echo "==> Cloning PlanX monorepo (shallow)..."
git clone --depth 1 --branch "$PLANX_COMMIT" "$PLANX_REPO" "$BUILD_DIR/planx-src" 2>/dev/null || \
  git clone --depth 1 "$PLANX_REPO" "$BUILD_DIR/planx-src"

echo "==> Preparing build context..."
mv "$BUILD_DIR/planx-src/apps/sharedb.planx.uk" "$BUILD_DIR/planx-src/sharedb.planx.uk"
cp "$SCRIPT_DIR/Dockerfile" "$BUILD_DIR/Dockerfile"

echo "==> Building Docker image..."
cd "$BUILD_DIR"
docker build -t ndx-planx-sharedb:latest .

if [ "${1:-}" = "--push" ] && [ -n "${2:-}" ]; then
  ECR_URI="$2"
  echo "==> Pushing to $ECR_URI..."
  docker tag ndx-planx-sharedb:latest "$ECR_URI:latest"
  docker push "$ECR_URI:latest"
fi

echo "==> Cleaning up..."
rm -rf "$BUILD_DIR"

echo "==> Done! Image: ndx-planx-sharedb:latest"
