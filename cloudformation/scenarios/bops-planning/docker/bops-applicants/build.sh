#!/bin/bash
set -e

# Local build script for BOPS-Applicants Docker image

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOPS_APPLICANTS_COMMIT="${BOPS_APPLICANTS_COMMIT:-main}"

echo "=== Building BOPS-Applicants Docker image ==="
echo "Commit: ${BOPS_APPLICANTS_COMMIT}"

if [ -d "${SCRIPT_DIR}/bops-applicants-src" ]; then
  rm -rf "${SCRIPT_DIR}/bops-applicants-src"
fi

echo "Cloning BOPS-Applicants..."
git clone --depth 1 https://github.com/unboxed/bops-applicants.git "${SCRIPT_DIR}/bops-applicants-src"
cd "${SCRIPT_DIR}/bops-applicants-src"
if [ "$BOPS_APPLICANTS_COMMIT" != "main" ]; then
  git fetch --depth 1 origin "$BOPS_APPLICANTS_COMMIT"
  git checkout "$BOPS_APPLICANTS_COMMIT"
fi
cd "${SCRIPT_DIR}"

# Copy overlay files
echo "Copying overlay files..."
cp "${SCRIPT_DIR}/config/initializers/default_local_authority.rb" "${SCRIPT_DIR}/bops-applicants-src/config/initializers/"

# Build using upstream Dockerfile.production
echo "Building Docker image..."
docker build -f "${SCRIPT_DIR}/bops-applicants-src/Dockerfile.production" -t bops-applicants:latest "${SCRIPT_DIR}/bops-applicants-src/"

echo "=== Build complete ==="
