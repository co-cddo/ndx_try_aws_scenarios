FROM node:23-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# Clone upstream and install deps
RUN git clone --depth 1 https://github.com/i-dot-ai/minute.git /upstream
RUN cp /upstream/frontend/package.json /upstream/frontend/package-lock.json ./
RUN npm ci

# Build the source code
FROM base AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Clone upstream again for the full frontend source
RUN git clone --depth 1 https://github.com/i-dot-ai/minute.git /upstream
RUN cp -r /upstream/frontend/* ./

# Replace auth middleware with no-op (ENVIRONMENT=local bypasses auth; upstream middleware crashes on Node 23 edge runtime)
COPY patches/middleware.ts ./middleware.ts

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8081

ENV PORT=8081
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
