import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://ecosphere:ecosphere_secret@localhost:5432/ecosphere';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '../sql/ecosphere_production_schema.sql');

async function bootstrap() {
  const sql = postgres(connectionString, { max: 1 });
  const ddl = readFileSync(schemaPath, 'utf8');

  console.log('Applying production schema DDL...');
  console.log(`Source: ${schemaPath}`);

  try {
    await sql.unsafe(ddl);
    console.log('Production schema applied successfully.');
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

bootstrap();
