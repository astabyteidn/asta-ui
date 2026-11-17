FROM oven/bun:1.3.3 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Content is fetched from the Rust API at build time when reachable;
# otherwise pages fall back to lib/seed.ts and refresh via ISR at runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME="0.0.0.0"

# Add graceful shutdown with STOPSIGNAL (SIGTERM is Docker standard)
STOPSIGNAL SIGTERM

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --no-create-home --shell /bin/false nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

# Health check with longer start-period to prevent premature restarts
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD bun -e "require('http').get('http://localhost:3001/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["bun", "server.js"]
