import { AppDataSource, initializeTypeOrmDataSource } from './data-source.js';

async function runMigrations(): Promise<void> {
  console.log('[typeorm] Initializing data source...');
  await initializeTypeOrmDataSource();

  console.log('[typeorm] Running pending migrations...');
  const executed = await AppDataSource.runMigrations({ transaction: 'each' });

  if (executed.length === 0) {
    console.log('[typeorm] No pending migrations.');
  } else {
    for (const migration of executed) {
      console.log(`[typeorm] Applied: ${migration.name}`);
    }
  }

  await AppDataSource.destroy();
  console.log('[typeorm] Migration state synchronized.');
}

runMigrations().catch((error: unknown) => {
  console.error('[typeorm] Migration failed:', error);
  process.exit(1);
});
