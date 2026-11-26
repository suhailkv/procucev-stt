import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { db } from '../src/lib/db.js';
import { runMigrations } from '../src/db/migrate.js';

const app = buildApp();

beforeAll(runMigrations);
beforeEach(() => db.query('TRUNCATE transcriptions RESTART IDENTITY'));
afterAll(() => db.close());

const create = (body) => request(app).post('/api/transcriptions').send(body);

describe('Transcriptions CRUD API', () => {
  it('creates a transcription and derives a title from the content', async () => {
    const res = await create({ content: 'Kal meeting hai at five pm please join karna sab log' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Kal meeting hai at five pm please join…',
      source: 'manual',
    });
  });

  it('rejects empty content with a 400 and field details', async () => {
    const res = await create({ content: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty('content');
  });

  it('lists newest first with pagination and search', async () => {
    await create({ content: 'pehla note' });
    await create({ content: 'second note in English' });
    await create({ content: 'teesra note' });

    const page = await request(app).get('/api/transcriptions?limit=2');
    expect(page.body.total).toBe(3);
    expect(page.body.totalPages).toBe(2);
    expect(page.body.items.map((t) => t.content)).toEqual(['teesra note', 'second note in English']);

    const search = await request(app).get('/api/transcriptions?q=english');
    expect(search.body.items).toHaveLength(1);
  });

  it('treats LIKE wildcards in search literally', async () => {
    await create({ content: 'discount 50% today' });
    await create({ content: 'discount 500 today' });
    const res = await request(app).get('/api/transcriptions?q=50%25');
    expect(res.body.items).toHaveLength(1);
  });

  it('reads, updates and deletes one transcription', async () => {
    const { body: created } = await create({ content: 'namaste duniya' });

    const read = await request(app).get(`/api/transcriptions/${created.id}`);
    expect(read.body.content).toBe('namaste duniya');

    const upd = await request(app)
      .put(`/api/transcriptions/${created.id}`)
      .send({ title: 'Greeting', content: 'namaste world' });
    expect(upd.status).toBe(200);
    expect(upd.body).toMatchObject({ title: 'Greeting', content: 'namaste world' });

    const del = await request(app).delete(`/api/transcriptions/${created.id}`);
    expect(del.status).toBe(204);
    expect((await request(app).get(`/api/transcriptions/${created.id}`)).status).toBe(404);
  });

  it('returns 400 for an empty update and 404 for unknown ids', async () => {
    const { body } = await create({ content: 'x' });
    expect((await request(app).put(`/api/transcriptions/${body.id}`).send({})).status).toBe(400);
    expect((await request(app).put('/api/transcriptions/999').send({ title: 'a' })).status).toBe(404);
    expect((await request(app).delete('/api/transcriptions/999')).status).toBe(404);
    expect((await request(app).get('/api/transcriptions/abc')).status).toBe(400);
  });
});
