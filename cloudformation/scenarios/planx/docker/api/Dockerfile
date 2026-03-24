# PlanX API with demo auth overlay
# Multi-stage build from the PlanX monorepo
FROM node:24.14-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo (pnpm workspaces need it)
COPY planx-src/ .

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Build the API
RUN cd api.planx.uk && pnpm build

# Apply demo auth overlay after build
COPY overlays/demo-auth.js /app/api.planx.uk/dist/demo-auth.js

# Production stage
FROM node:24.14-alpine AS production

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
