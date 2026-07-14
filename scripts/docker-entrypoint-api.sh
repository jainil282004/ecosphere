#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-postgresql://ecosphere:ecosphere_secret@postgres:5432/ecosphere}"
export DATABASE_URL

echo "[ecosphere] Waiting for PostgreSQL..."
(cd packages/db && node dist/wait-for-postgres.js)

echo "[ecosphere] Applying Drizzle schema migrations..."
(cd packages/db && node dist/migrate.js)

echo "[ecosphere] Synchronizing TypeORM migration state..."
(cd packages/db-typeorm && node dist/migrate.js)

if [ "${ECOSPHERE_SEED_ON_START:-false}" = "true" ]; then
  echo "[ecosphere] Seeding database..."
  (cd packages/db && node dist/seed.js)
fi

echo "[ecosphere] Starting API..."
exec "$@"
