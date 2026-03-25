#!/bin/bash
set -euo pipefail

# Build PlanX Editor image (pre-built SPA in nginx)
# Usage: ./build.sh [--push ECR_URI]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR=$(mktemp -d)
PLANX_REPO="https://github.com/theopensystemslab/planx-new.git"
PLANX_COMMIT="${PLANX_COMMIT:-main}"

echo "==> Cloning PlanX monorepo (shallow)..."
git clone --depth 1 --branch "$PLANX_COMMIT" "$PLANX_REPO" "$BUILD_DIR/planx-src" 2>/dev/null || \
  git clone --depth 1 "$PLANX_REPO" "$BUILD_DIR/planx-src"

echo "==> Preparing build context..."
# Move editor to expected path
mv "$BUILD_DIR/planx-src/apps/editor.planx.uk" "$BUILD_DIR/planx-src/editor.planx.uk"

cp "$SCRIPT_DIR/Dockerfile" "$BUILD_DIR/Dockerfile"
cp "$SCRIPT_DIR/nginx.conf" "$BUILD_DIR/nginx.conf"
cp "$SCRIPT_DIR/entrypoint.sh" "$BUILD_DIR/entrypoint.sh"

echo "==> Building Docker image (this may take several minutes)..."
cd "$BUILD_DIR"
docker build -t ndx-planx-editor:latest .

if [ "${1:-}" = "--push" ] && [ -n "${2:-}" ]; then
  ECR_URI="$2"
  echo "==> Pushing to $ECR_URI..."
  docker tag ndx-planx-editor:latest "$ECR_URI:latest"
  docker push "$ECR_URI:latest"
fi

echo "==> Cleaning up..."
rm -rf "$BUILD_DIR"

echo "==> Done! Image: ndx-planx-editor:latest"
