#!/bin/sh
# Patches server.ts to add demo auth routes before the error handlers.
# Run this after cloning the PlanX source, before building.

set -e

API_DIR="$1"
if [ -z "$API_DIR" ]; then
  echo "Usage: patch-demo-auth.sh <api-dir>"
  exit 1
fi

# 1. Copy demo-auth.ts to modules/auth/
cp "$(dirname "$0")/overlays/demo-auth.ts" "$API_DIR/modules/auth/demo-auth.ts"

# 2. Add import at the top of server.ts (after the last import)
sed -i.bak '/^import { apiLimiter/a\
import { setupDemoAuth } from "./modules/auth/demo-auth.js";' "$API_DIR/server.ts"

# 3. Add demo auth setup before error handlers (the // Handle any server errors comment)
sed -i.bak '/^\/\/ Handle any server errors/i\
// NDX:Try demo auth (bypasses Google/Microsoft OAuth)\
if (process.env.DEMO_MODE === "true") {\
  setupDemoAuth(app);\
  console.info("Demo auth enabled at /auth/demo");\
}' "$API_DIR/server.ts"

echo "Demo auth patched into server.ts"
