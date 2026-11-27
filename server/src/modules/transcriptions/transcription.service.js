import { HttpError } from '../../lib/http.js';
import { transcriptionRepository as repo } from './transcription.repository.js';

export function deriveTitle(content, words = 8) {
  const parts = content.trim().split(/\s+/);
  const title = parts.slice(0, words).join(' ');
  return (parts.length > words ? `${title}…` : title).slice(0, 200);
}

export const transcriptionService = {
  async list({ q, page, limit }) {
    const { items, total } = await repo.list({ q, limit, offset: (page - 1) * limit });
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async get(id) {
    const t = await repo.findById(id);
    if (!t) throw HttpError.notFound('Transcription');
    return t;
  },

  async create(input) {
    return repo.create({ ...input, title: input.title || deriveTitle(input.content) });
  },

  async update(id, fields) {
    const t = await repo.update(id, fields);
    if (!t) throw HttpError.notFound('Transcription');
    return t;
  },

  async remove(id) {
    if (!(await repo.remove(id))) throw HttpError.notFound('Transcription');
  },
};
