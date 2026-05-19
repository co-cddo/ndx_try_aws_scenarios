# PlanX ShareDB — real-time collaborative editing via WebSocket
# Multi-stage build from the PlanX monorepo
FROM node:24.15-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the full monorepo
COPY planx-src/ .

# Install sharedb deps inside its own dir. Upstream's sharedb.planx.uk has its
# own pnpm-lock.yaml; the root has no pnpm-workspace.yaml that links it, so a
# root-level install only brings in `typescript` and the sharedb deps go
# missing. (Same fix pattern as editor and api Dockerfiles.)
RUN cd sharedb.planx.uk && (pnpm install --frozen-lockfile || pnpm install)

# ShareDB has no build step — server.js runs directly from source.

# Production stage
FROM node:24.15-alpine AS production

WORKDIR /app

COPY --from=build /app/sharedb.planx.uk/ ./

ENV PORT=8000
ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "server.js"]
