/**
 * Cross-platform PostgreSQL readiness probe for migrations and API startup.
 */
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere';

const maxAttempts = Number(process.env.DB_WAIT_MAX_ATTEMPTS ?? 60);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS ?? 2000);

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let client: ReturnType<typeof postgres> | undefined;
    try {
      client = postgres(connectionString, { max: 1, connect_timeout: 5 });
      await client`SELECT 1 AS ready`;
      await client.end({ timeout: 5 });
      console.log(`[wait-for-postgres] Database ready (attempt ${attempt}/${maxAttempts}).`);
      return;
    } catch (error) {
      if (client) {
        await client.end({ timeout: 5 }).catch(() => undefined);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `[wait-for-postgres] Attempt ${attempt}/${maxAttempts} failed: ${message}`,
      );
      if (attempt === maxAttempts) {
        throw new Error('PostgreSQL did not become ready in time.');
      }
      await sleep(delayMs);
    }
  }
}

waitForPostgres().catch((error) => {
  console.error('[wait-for-postgres] Fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
