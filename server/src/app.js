/**
 * Express app composition: middleware → feature routers → SPA → errors.
 * Kept separate from server.js so tests can mount it without listening.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, errorHandler, notFoundHandler, serveStatic } from './lib/http.js';
import { db } from './lib/db.js';
import { env } from './lib/env.js';
import { transcriptionRouter } from './modules/transcriptions/index.js';

export function buildApp() {
  const app = createApp();

  app.get('/api/health', async (_req, res) => {
    await db.ping();
    res.json({ status: 'ok', stt: env.STT_PROVIDER });
  });

  app.use('/api/transcriptions', transcriptionRouter);
  app.use('/api', notFoundHandler);

  // Serve the built React client (single deployable unit).
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(env.CLIENT_DIST ?? path.join(here, '../../client/dist'));
  if (existsSync(clientDist)) {
    app.use(serveStatic(clientDist));
    app.get(/^\/(?!api|ws).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
