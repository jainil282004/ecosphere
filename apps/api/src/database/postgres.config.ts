import { createDb, type Database, type DbExecutor } from '@ecosphere/db';

export interface PostgresPoolConfig {
  maxConnections: number;
  idleTimeoutSeconds: number;
  connectTimeoutSeconds: number;
  prepare: boolean;
}

export function resolvePoolConfig(): PostgresPoolConfig {
  return {
    maxConnections: Number(process.env.DB_POOL_MAX ?? 20),
    idleTimeoutSeconds: Number(process.env.DB_POOL_IDLE_TIMEOUT ?? 30),
    connectTimeoutSeconds: Number(process.env.DB_POOL_CONNECT_TIMEOUT ?? 10),
    prepare: process.env.DB_PREPARE_STATEMENTS !== 'false',
  };
}

export function createDbWithPool(connectionString: string) {
  const pool = resolvePoolConfig();
  return createDb(connectionString, {
    maxConnections: pool.maxConnections,
    idleTimeoutSeconds: pool.idleTimeoutSeconds,
    connectTimeoutSeconds: pool.connectTimeoutSeconds,
    prepare: pool.prepare,
  });
}

export type { Database, DbExecutor };
