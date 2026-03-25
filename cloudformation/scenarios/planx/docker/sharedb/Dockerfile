# PlanX ShareDB — real-time collaborative editing via WebSocket
# Multi-stage build from the PlanX monorepo
FROM node:24.14-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo
COPY planx-src/ .

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Build ShareDB
RUN cd sharedb.planx.uk && pnpm build 2>/dev/null || true

# Production stage
FROM node:24.14-alpine AS production

WORKDIR /app

COPY --from=build /app/sharedb.planx.uk/ ./
# ShareDB may not have a build step — it runs server.js directly

ENV PORT=8000
ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "server.js"]
