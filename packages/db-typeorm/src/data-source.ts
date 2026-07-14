import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { resolveDatabaseUrl, resolveTypeOrmPoolConfig } from './config/pool.config.js';
import { TYPEORM_ENTITIES } from './entities/index.js';
import { InitialBaseline1739260800000 } from './migrations/1739260800000-InitialBaseline.js';

export function buildTypeOrmOptions(
  overrides: Record<string, unknown> = {},
): DataSourceOptions {
  const pool = resolveTypeOrmPoolConfig();

  return {
    type: 'postgres',
    url: resolveDatabaseUrl(),
    entities: [...TYPEORM_ENTITIES],
    migrations: [InitialBaseline1739260800000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
    extra: {
      max: pool.maxConnections,
      idleTimeoutMillis: pool.idleTimeoutMillis,
      connectionTimeoutMillis: pool.connectionTimeoutMillis,
    },
    ...overrides,
  } as DataSourceOptions;
}

export const AppDataSource = new DataSource(buildTypeOrmOptions());

export async function initializeTypeOrmDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
