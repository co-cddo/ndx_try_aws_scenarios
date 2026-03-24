# PlanX Editor - pre-built SPA served by nginx
# Multi-stage build from the PlanX monorepo
FROM node:24.14-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo
COPY planx-src/ .

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Build editor with relative URLs (all services behind same CloudFront/ALB)
# WebSocket URLs use window.location.host (injected at runtime)
ENV VITE_APP_API_URL=/api
ENV VITE_APP_HASURA_URL=/hasura/v1/graphql
ENV VITE_APP_HASURA_WEBSOCKET=wss://__PLANX_HOST__/hasura/v1/graphql
ENV VITE_APP_SHAREDB_URL=wss://__PLANX_HOST__/sharedb
ENV VITE_APP_ENV=production
ENV VITE_APP_AIRBRAKE_PROJECT_ID=0
ENV VITE_APP_AIRBRAKE_PROJECT_KEY=unused

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
