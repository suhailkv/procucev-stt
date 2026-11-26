/** Entry point: migrate DB → start HTTP + WebSocket server → graceful shutdown. */
import { createServer } from 'node:http';
import { buildApp } from './app.js';
import { env } from './lib/env.js';
import { db } from './lib/db.js';
import { logger } from './lib/logger.js';
import { runMigrations } from './db/migrate.js';
import { attachLiveTranscription, LIVE_PATH } from './modules/live/index.js';

await runMigrations();

const server = createServer(buildApp());
const live = attachLiveTranscription(server);

server.listen(env.PORT, () =>
  logger.info('server started', { port: env.PORT, ws: LIVE_PATH, stt: env.STT_PROVIDER }),
);

async function shutdown(signal) {
  logger.info('shutting down', { signal });
  await live.close();
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
