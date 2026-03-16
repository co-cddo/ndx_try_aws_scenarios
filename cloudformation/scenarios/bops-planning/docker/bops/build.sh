#!/bin/bash
set -e

# Local build script for BOPS Docker image
# For CI, see .github/workflows/docker-build-bops.yml

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOPS_COMMIT="${BOPS_COMMIT:-main}"

echo "=== Building BOPS Docker image ==="
echo "Commit: ${BOPS_COMMIT}"

# Clone BOPS source
if [ -d "${SCRIPT_DIR}/bops-src" ]; then
  echo "Removing existing bops-src..."
  rm -rf "${SCRIPT_DIR}/bops-src"
fi

echo "Cloning BOPS..."
git clone --depth 1 https://github.com/unboxed/bops.git "${SCRIPT_DIR}/bops-src"
cd "${SCRIPT_DIR}/bops-src"
if [ "$BOPS_COMMIT" != "main" ]; then
  git fetch --depth 1 origin "$BOPS_COMMIT"
  git checkout "$BOPS_COMMIT"
fi
cd "${SCRIPT_DIR}"

# Copy overlay files
echo "Copying overlay files..."
cp "${SCRIPT_DIR}/config/initializers/default_local_authority.rb" "${SCRIPT_DIR}/bops-src/config/initializers/"
cp "${SCRIPT_DIR}/scripts/seed_sample_data.rb" "${SCRIPT_DIR}/bops-src/scripts/"
cp "${SCRIPT_DIR}/scripts/seed-entrypoint.sh" "${SCRIPT_DIR}/bops-src/scripts/"
cp "${SCRIPT_DIR}/entrypoint.sh" "${SCRIPT_DIR}/bops-src/"

# Build using upstream Dockerfile.production
echo "Building Docker image..."
docker build -f "${SCRIPT_DIR}/bops-src/Dockerfile.production" -t bops:latest "${SCRIPT_DIR}/bops-src/"

echo "=== Build complete ==="
echo "Run with: docker run -p 3000:3000 bops:latest"
