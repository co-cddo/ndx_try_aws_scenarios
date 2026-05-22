# PlanX API with demo auth overlay
# Multi-stage build from the PlanX monorepo
FROM node:24.16.0-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo (still useful for workspace package references)
COPY planx-src/ .

# Install api deps inside api.planx.uk. Upstream's api.planx.uk carries its
# own pnpm-lock.yaml and is no longer linked through a root pnpm-workspace.yaml,
# so a root-level install just pulls in `typescript` and the api's own
# deps go missing (build then fails with "tsc not found").
RUN cd api.planx.uk && (pnpm install --frozen-lockfile || pnpm install)

# Build the API (server.ts has been patched by build.sh to call setupDemoAuth)
RUN cd api.planx.uk && pnpm build

# Pre-compiled JS overlay used by the patched server import resolution
COPY overlays/demo-auth.js /app/api.planx.uk/dist/demo-auth.js

# Production stage
FROM node:24.16.0-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=build /app/api.planx.uk/dist/ ./dist/
COPY --from=build /app/api.planx.uk/node_modules/ ./node_modules/
COPY --from=build /app/api.planx.uk/package.json ./

# Patch the entry point to load demo auth before starting
RUN echo 'require("./demo-auth");' > /app/dist/_demo-init.js && \
    cat /app/dist/index.js >> /app/dist/_demo-init.js.tmp 2>/dev/null || true

ENV PORT=7002
ENV NODE_ENV=production

EXPOSE 7002

CMD ["node", "dist/index.js"]
