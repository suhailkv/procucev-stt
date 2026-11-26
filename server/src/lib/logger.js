/**
 * lib/logger — our own tiny structured (JSON-lines) logger.
 * Swap for pino/winston here without touching any caller.
 */
function log(level, msg, meta) {
  if (process.env.NODE_ENV === 'test' && level !== 'error') return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta });
  (level === 'error' ? console.error : console.log)(line);
}

export const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
