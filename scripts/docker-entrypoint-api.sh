#!/bin/sh
set -eu

DATABASE_URL="${DATABASE_URL:-postgresql://ecosphere:ecosphere_secret@postgres:5432/ecosphere}"
export DATABASE_URL

echo "[ecosphere] Waiting for PostgreSQL..."
node packages/db/dist/wait-for-postgres.js

echo "[ecosphere] Applying Drizzle schema migrations..."
node packages/db/dist/migrate.js

echo "[ecosphere] Synchronizing TypeORM migration state..."
node packages/db-typeorm/dist/migrate.js

if [ "${ECOSPHERE_SEED_ON_START:-false}" = "true" ]; then
  echo "[ecosphere] Seeding database..."
  node packages/db/dist/seed.js
fi

echo "[ecosphere] Starting API..."
exec "$@"
