/**
 * STT module. Every provider implements the same contract:
 *
 *   provider.open({ languageCodes }, { onInterim, onFinal, onError, onClose })
 *     → Promise<{ sendPcm(Buffer), endAudio(), close() }>
 *
 * Audio in is always 16 kHz / 16-bit / mono PCM. Adding a self-hosted
 * open-source engine (e.g. faster-whisper) = one new file + one map entry.
 */
import { env } from '../../lib/env.js';
import { geminiProvider } from './gemini.provider.js';
import { mockProvider } from './mock.provider.js';

const providers = { gemini: geminiProvider, mock: mockProvider };

export function getSttProvider(name = env.STT_PROVIDER) {
  const p = providers[name];
  if (!p) throw new Error(`Unknown STT provider: ${name}`);
  return p;
}
