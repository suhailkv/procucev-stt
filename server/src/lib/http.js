import express from 'express';
import { ZodError, formatIssues } from './validation.js';
import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static notFound(what = 'Resource') {
    return new HttpError(404, `${what} not found`);
  }
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  return app;
}

export const createRouter = () => express.Router();
export const serveStatic = (dir) => express.static(dir, { index: false, maxAge: '1h' });

export function notFoundHandler(_req, _res, next) {
  next(HttpError.notFound('Route'));
}

// Express only treats middleware with 4 arguments as an error handler.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: formatIssues(err) });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  logger.error('unhandled error', { err: err?.stack ?? String(err) });
  return res.status(500).json({ error: 'Internal server error' });
}
