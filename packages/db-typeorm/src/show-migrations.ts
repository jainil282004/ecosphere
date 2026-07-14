import { AppDataSource, initializeTypeOrmDataSource } from './data-source.js';

async function showMigrations(): Promise<void> {
  await initializeTypeOrmDataSource();
  const pending = await AppDataSource.showMigrations();
  const executed = await AppDataSource.query(
    `SELECT id, timestamp, name FROM typeorm_migrations ORDER BY id ASC`,
  );

  console.log('[typeorm] Executed migrations:', executed);
  console.log('[typeorm] Has pending migrations:', pending);
  await AppDataSource.destroy();
}

showMigrations().catch((error: unknown) => {
  console.error('[typeorm] Failed to read migration state:', error);
  process.exit(1);
});
