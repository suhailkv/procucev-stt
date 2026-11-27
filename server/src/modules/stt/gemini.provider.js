import { openLiveTranscription } from '../../lib/gemini-live.js';
import { env } from '../../lib/env.js';

export const geminiProvider = {
  name: 'gemini',
  async open({ languageCodes }, callbacks) {
    if (!env.GEMINI_API_KEY) throw new Error('Speech service is not configured (missing GEMINI_API_KEY)');
    return openLiveTranscription(
      { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, languageCodes },
      callbacks,
    );
  },
};
