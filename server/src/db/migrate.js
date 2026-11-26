/**
 * Minimal forward-only migration runner.
 * Applies every db/migrations/*.sql file once, in filename order, each inside
 * a transaction, and records it in `schema_migrations`.
 * Run directly (`npm run migrate`) or call runMigrations() at server start.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function runMigrations() {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const { rows } = await db.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), 'utf8');
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await db.query('COMMIT');
      logger.info('migration applied', { file });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  }
}

// `node src/db/migrate.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => logger.info('migrations complete'))
    .catch((err) => {
      logger.error('migration failed', { err: err.message });
      process.exitCode = 1;
    })
    .finally(() => db.close());
}
