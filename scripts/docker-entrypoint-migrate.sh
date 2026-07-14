#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-postgresql://ecosphere:ecosphere_secret@postgres:5432/ecosphere}"
export DATABASE_URL

echo "[ecosphere-migrate] Waiting for PostgreSQL..."
pnpm --filter @ecosphere/db wait

echo "[ecosphere-migrate] Running Drizzle schema migrations..."
pnpm --filter @ecosphere/db migrate

echo "[ecosphere-migrate] Synchronizing TypeORM migration state..."
pnpm --filter @ecosphere/db-typeorm migrate

if [ "${ECOSPHERE_SEED_ON_MIGRATE:-false}" = "true" ]; then
  echo "[ecosphere-migrate] Seeding database..."
  pnpm --filter @ecosphere/db seed
fi

echo "[ecosphere-migrate] Migration job completed."
