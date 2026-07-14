import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export interface PostgresPoolOptions {
  maxConnections?: number;
  idleTimeoutSeconds?: number;
  connectTimeoutSeconds?: number;
  prepare?: boolean;
}

export function createDb(connectionString: string, poolOptions?: PostgresPoolOptions) {
  const client = postgres(connectionString, {
    max: poolOptions?.maxConnections ?? 20,
    idle_timeout: poolOptions?.idleTimeoutSeconds ?? 30,
    connect_timeout: poolOptions?.connectTimeoutSeconds ?? 10,
    prepare: poolOptions?.prepare ?? true,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

export type Database = ReturnType<typeof createDb>['db'];
export type DbExecutor = Pick<Database, 'insert' | 'update' | 'delete' | 'select' | 'query' | 'transaction'>;

export * from './schema/index.js';
