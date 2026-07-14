#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-postgresql://ecosphere:ecosphere_secret@postgres:5432/ecosphere}"
export DATABASE_URL

echo "[ecosphere] Waiting for PostgreSQL..."
pnpm --filter @ecosphere/db wait

echo "[ecosphere] Applying Drizzle schema migrations..."
pnpm --filter @ecosphere/db migrate

echo "[ecosphere] Synchronizing TypeORM migration state..."
pnpm --filter @ecosphere/db-typeorm migrate

if [ "${ECOSPHERE_SEED_ON_START:-false}" = "true" ]; then
  echo "[ecosphere] Seeding database..."
  pnpm --filter @ecosphere/db seed
fi

echo "[ecosphere] Starting API..."
exec "$@"
