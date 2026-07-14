# syntax=docker/dockerfile:1.7
# EcoSphere API — production multi-stage build (Alpine, non-root, cached dependencies)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ── Dependencies (cached layer) ───────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/db-typeorm/package.json ./packages/db-typeorm/
COPY packages/shared/package.json ./packages/shared/
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/db-typeorm ./packages/db-typeorm
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./
RUN pnpm --filter @ecosphere/shared build \
 && pnpm --filter @ecosphere/db build \
 && pnpm --filter @ecosphere/db-typeorm build \
 && pnpm --filter @ecosphere/api build

# ── Production runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat dumb-init \
 && addgroup -g 1001 -S ecosphere \
 && adduser -S ecosphere -u 1001 -G ecosphere

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH" \
    NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --chown=ecosphere:ecosphere package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=ecosphere:ecosphere apps/api/package.json ./apps/api/
COPY --chown=ecosphere:ecosphere packages/db/package.json ./packages/db/
COPY --chown=ecosphere:ecosphere packages/db-typeorm/package.json ./packages/db-typeorm/
COPY --chown=ecosphere:ecosphere packages/shared/package.json ./packages/shared/

COPY --from=deps --chown=ecosphere:ecosphere /app/node_modules ./node_modules
COPY --from=deps --chown=ecosphere:ecosphere /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps --chown=ecosphere:ecosphere /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps --chown=ecosphere:ecosphere /app/packages/shared/node_modules ./packages/shared/node_modules

COPY --from=build --chown=ecosphere:ecosphere /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=ecosphere:ecosphere /app/packages/db/dist ./packages/db/dist
COPY --from=build --chown=ecosphere:ecosphere /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=build --chown=ecosphere:ecosphere /app/packages/db-typeorm/dist ./packages/db-typeorm/dist
COPY --from=build --chown=ecosphere:ecosphere /app/packages/shared/dist ./packages/shared/dist

COPY --chown=ecosphere:ecosphere scripts/docker-entrypoint-api.sh ./scripts/docker-entrypoint-api.sh
RUN chmod +x ./scripts/docker-entrypoint-api.sh

USER ecosphere

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "./scripts/docker-entrypoint-api.sh"]
CMD ["node", "apps/api/dist/main.js"]
