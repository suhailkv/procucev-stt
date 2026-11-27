import { z } from '../../lib/validation.js';

export const MAX_CONTENT = 20000;

const title = z.string().trim().min(1, 'Title cannot be empty').max(200);
const content = z.string().trim().min(1, 'Content cannot be empty').max(MAX_CONTENT);
const language = z.string().trim().max(32).nullable();

export const idParam = z.object({ id: z.coerce.number().int().positive('Invalid id') });

export const listQuery = z.object({
  q: z.string().trim().max(200).optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createBody = z.object({
  title: title.optional(),
  content,
  language: language.optional(),
  source: z.enum(['live', 'manual']).default('manual'),
  durationMs: z.number().int().min(0).nullable().optional(),
});

export const updateBody = z
  .object({ title: title.optional(), content: content.optional(), language: language.optional() })
  .refine((b) => Object.keys(b).length > 0, { message: 'Provide at least one field to update' });
