import { env } from '../../lib/env.js';
import { geminiProvider } from './gemini.provider.js';
import { mockProvider } from './mock.provider.js';

const providers = { gemini: geminiProvider, mock: mockProvider };

export function getSttProvider(name = env.STT_PROVIDER) {
  const p = providers[name];
  if (!p) throw new Error(`Unknown STT provider: ${name}`);
  return p;
}
