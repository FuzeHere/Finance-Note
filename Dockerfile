# Multi-stage Dockerfile untuk Finance-Note (DompetKu)
# Base image dengan Node.js 22 LTS Debian slim
FROM node:22-bookworm-slim AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build aplikasi Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nonaktifkan telemetri Next.js saat build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Runner production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH="/app/data/finance.sqlite"

# Buat grup dan user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Siapkan direktori penyimpanan data SQLite persistent
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Salin aset publik dan output standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3100

# Volume untuk persistensi SQLite database
VOLUME ["/app/data"]

CMD ["node", "server.js"]
