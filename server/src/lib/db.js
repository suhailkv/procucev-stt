/**
 * lib/db — wraps `pg`.
 * Owns the connection pool; modules call `db.query(sql, params)` with
 * parameterised SQL only (no string concatenation → no SQL injection).
 */
import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (err) => logger.error('pg pool error', { err: err.message }));

export const db = {
  /** @returns {Promise<{rows: any[], rowCount: number}>} */
  async query(text, params = []) {
    const res = await pool.query(text, params);
    return { rows: res.rows, rowCount: res.rowCount ?? 0 };
  },
  async ping() {
    await pool.query('SELECT 1');
  },
  async close() {
    await pool.end();
  },
};
