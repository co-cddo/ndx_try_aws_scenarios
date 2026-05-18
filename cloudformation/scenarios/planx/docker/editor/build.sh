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

# Patch validateDomain to accept the runtime host. Upstream restricts /app
# to editor.planx.{dev,uk}, *.planx.pizza, and localhost:3000; on any other
# host (e.g. our ephemeral CloudFront distributions) the route guard throws
# redirect({to:"/login"}) before initAuthStore runs, so the demo cookie is
# never exchanged for a /user/me lookup. Replacing the body with a no-op is
# the smallest change that lets the existing auth flow take over.
LOADER="$BUILD_DIR/planx-src/editor.planx.uk/src/routes/_authenticated/-loader.tsx"
if [ -f "$LOADER" ]; then
  cat > "$LOADER" <<'EOF'
// NDX:Try patch: original validateDomain restricts /app to a hardcoded
// allowlist of upstream hosts and redirects everything else to /login,
// blocking the demo auth flow on our CloudFront distributions.
export const validateDomain = () => {};
EOF
  echo "    patched _authenticated/-loader.tsx"
fi

# Replace airbrake.ts with an unconditional no-op logger. Upstream's
# hasConfig check is *meant* to take the no-op branch when VITE_APP_AIRBRAKE_*
# env vars are unset, but in practice the deployed SPA still calls
# `new Notifier()` somewhere and the SDK throws `projectId and projectKey are
# required` synchronously during module init, blanking the editor. Stubbing
# the module is the smallest change that guarantees the import path is safe
# regardless of upstream drift.
AIRBRAKE="$BUILD_DIR/planx-src/editor.planx.uk/src/airbrake.ts"
if [ -f "$AIRBRAKE" ]; then
  cat > "$AIRBRAKE" <<'EOF'
// NDX:Try patch: stub Airbrake out entirely. We don't ship error telemetry
// to Airbrake in the sandbox, and `new Notifier()` throws on empty creds.
export const logger = {
  notify: (error: unknown) => {
    if (typeof console !== "undefined") console.warn("[airbrake stub]", error);
  },
};
EOF
  echo "    patched airbrake.ts (no-op stub)"
fi

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
