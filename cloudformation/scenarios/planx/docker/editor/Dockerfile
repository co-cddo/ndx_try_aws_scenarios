# PlanX Editor - pre-built SPA served by nginx
# Multi-stage build from the PlanX monorepo
FROM node:24.15-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo
COPY planx-src/ .

# Install editor deps. Upstream's editor.planx.uk is a self-contained pnpm
# project (its own pnpm-lock.yaml) and is no longer linked via a root
# pnpm-workspace.yaml, so installing at the root just brings in `typescript`
# and the editor's `tsc`/`vite` end up missing. Install inside the editor
# directory directly.
RUN cd editor.planx.uk && (pnpm install --frozen-lockfile || pnpm install)

# Build editor with relative URLs (all services behind same CloudFront/ALB)
# WebSocket URLs use window.location.host (injected at runtime)
ENV VITE_APP_API_URL=/api
# CloudFront routes /v1/*, /v2/* and /console/* directly to Hasura; there is
# no /hasura/* cache behaviour. Build with the same paths so the editor's
# GraphQL client doesn't end up at the editor nginx (405) or ShareDB.
ENV VITE_APP_HASURA_URL=/v1/graphql
ENV VITE_APP_HASURA_WEBSOCKET=wss://__PLANX_HOST__/v1/graphql
ENV VITE_APP_SHAREDB_URL=wss://__PLANX_HOST__/sharedb
ENV VITE_APP_ENV=production
# Airbrake is stubbed out at build time by docker/editor/build.sh — upstream's
# `hasConfig` branch was unreliable in our deployed bundle and the SDK kept
# throwing `projectId and projectKey are required` during module init, blanking
# the SPA. No env vars are needed here.

RUN cd editor.planx.uk && pnpm build

# Production stage — nginx serving static files
FROM nginx:1.27-alpine

# Copy built SPA
COPY --from=build /app/editor.planx.uk/build/ /usr/share/nginx/html/

# nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint script for runtime config injection
COPY entrypoint.sh /docker-entrypoint.d/99-planx-config.sh
RUN chmod +x /docker-entrypoint.d/99-planx-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
