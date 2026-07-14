export interface TypeOrmPoolConfig {
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export function resolveTypeOrmPoolConfig(): TypeOrmPoolConfig {
  return {
    maxConnections: Number(process.env.DB_POOL_MAX ?? 20),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT ?? 30) * 1000,
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT ?? 10) * 1000,
  };
}

export function resolveDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere'
  );
}
