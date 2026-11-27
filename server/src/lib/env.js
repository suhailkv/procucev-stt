import 'dotenv/config';
import { z } from './validation.js';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  STT_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-transcribe-live'),
  // Gemini live sessions are capped at 10 min; stop at 9 so the transcript still gets saved.
  MAX_SESSION_SECONDS: z.coerce.number().int().positive().default(540),
  CLIENT_DIST: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.issues);
  process.exit(1);
}
if (parsed.data.STT_PROVIDER === 'gemini' && !parsed.data.GEMINI_API_KEY) {
  console.warn('[env] GEMINI_API_KEY is not set — live transcription will fail until it is.');
}

export const env = Object.freeze(parsed.data);
