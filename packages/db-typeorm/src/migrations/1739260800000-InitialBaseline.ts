import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline migration — records explicit TypeORM migration state.
 * Schema is applied by Drizzle migrations (pnpm db:migrate); this migration
 * ensures TypeORM migration tracking is initialized for production audit trails.
 */
export class InitialBaseline1739260800000 implements MigrationInterface {
  name = 'InitialBaseline1739260800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS typeorm_migration_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL
      );
    `);

    await queryRunner.query(`
      INSERT INTO typeorm_migration_audit (migration_name, checksum)
      VALUES ('InitialBaseline1739260800000', 'ecosphere-typeorm-baseline-v1')
      ON CONFLICT (migration_name) DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS typeorm_migration_audit;`);
  }
}
