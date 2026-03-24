#!/bin/sh
# Runtime config injection for PlanX editor
# Replaces __PLANX_HOST__ placeholder in built JS with actual CloudFront/ALB domain
# This runs as part of nginx's docker-entrypoint.d

if [ -n "${PLANX_HOST:-}" ]; then
  echo "Injecting PLANX_HOST=$PLANX_HOST into editor JS bundles..."
  find /usr/share/nginx/html -name '*.js' -exec sed -i "s/__PLANX_HOST__/${PLANX_HOST}/g" {} +
  echo "Config injection complete."
else
  echo "PLANX_HOST not set — using window.location.host fallback"
  # Replace with a JS expression that reads from window.location.host
  find /usr/share/nginx/html -name '*.js' -exec sed -i "s/__PLANX_HOST__/\"+window.location.host+\"/g" {} +
fi
