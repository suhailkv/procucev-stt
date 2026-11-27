import { db } from '../../lib/db.js';

const COLUMNS = 'id, title, content, language, source, duration_ms, created_at, updated_at';

const toModel = (r) => ({
  id: r.id,
  title: r.title,
  content: r.content,
  language: r.language,
  source: r.source,
  durationMs: r.duration_ms,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Escape LIKE wildcards so searching "50%" matches the literal text.
const likeTerm = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const transcriptionRepository = {
  async list({ q, limit, offset }) {
    const where = q ? 'WHERE title ILIKE $1 OR content ILIKE $1' : '';
    const params = q ? [likeTerm(q)] : [];
    const n = params.length;

    const [items, count] = await Promise.all([
      db.query(
        `SELECT ${COLUMNS} FROM transcriptions ${where}
         ORDER BY created_at DESC, id DESC LIMIT $${n + 1} OFFSET $${n + 2}`,
        [...params, limit, offset],
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM transcriptions ${where}`, params),
    ]);
    return { items: items.rows.map(toModel), total: count.rows[0].total };
  },

  async findById(id) {
    const { rows } = await db.query(`SELECT ${COLUMNS} FROM transcriptions WHERE id = $1`, [id]);
    return rows[0] ? toModel(rows[0]) : null;
  },

  async create({ title, content, language, source, durationMs }) {
    const { rows } = await db.query(
      `INSERT INTO transcriptions (title, content, language, source, duration_ms)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
      [title, content, language ?? null, source, durationMs ?? null],
    );
    return toModel(rows[0]);
  },

  async update(id, fields) {
    // Only these keys can ever become column names in the SQL.
    const map = { title: 'title', content: 'content', language: 'language' };
    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(map)) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        sets.push(`${col} = $${params.length}`);
      }
    }
    params.push(id);
    const { rows } = await db.query(
      `UPDATE transcriptions SET ${sets.join(', ')}, updated_at = now()
       WHERE id = $${params.length} RETURNING ${COLUMNS}`,
      params,
    );
    return rows[0] ? toModel(rows[0]) : null;
  },

  async remove(id) {
    const { rowCount } = await db.query('DELETE FROM transcriptions WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
