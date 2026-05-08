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

# 3. Add demo auth setup BEFORE the API route mounting (// Setup API routes anchor).
# setupDemoAuth installs an `/api`-prefix-stripping middleware so /api/user/me
# can reach the upstream user router. That middleware MUST run before
# app.use(userRoutes) etc., or the rewrite happens too late and ALB-routed
# /api/* requests 404. Inserting before the // Setup API routes comment
# guarantees the right order regardless of which route bundles are added later.
sed -i.bak '/^\/\/ Setup API routes/i\
// NDX:Try demo auth (bypasses Google/Microsoft OAuth). Registered BEFORE the\
// upstream route bundles so its /api-prefix-stripping middleware runs first.\
if (process.env.DEMO_MODE === "true") {\
  setupDemoAuth(app);\
  console.info("Demo auth enabled at /auth/demo");\
}' "$API_DIR/server.ts"

echo "Demo auth patched into server.ts"
