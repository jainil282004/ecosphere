import pg from 'pg';
import { resolveDatabaseUrl } from './config/pool.config.js';

const maxAttempts = Number(process.env.DB_WAIT_MAX_ATTEMPTS ?? 60);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS ?? 2000);

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const pool = new pg.Pool({
      connectionString: resolveDatabaseUrl(),
      max: 1,
      connectionTimeoutMillis: 5000,
    });
    try {
      await pool.query('SELECT 1 AS ready');
      await pool.end();
      console.log(`[typeorm-wait] Database ready (attempt ${attempt}/${maxAttempts}).`);
      return;
    } catch (error) {
      await pool.end().catch(() => undefined);
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
}

waitForPostgres().catch(() => process.exit(1));
