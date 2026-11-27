import { GoogleGenAI, Modality } from '@google/genai';
import { logger } from './logger.js';

export async function openLiveTranscription(opts, cb) {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey, httpOptions: { apiVersion: 'v1beta' } });

  const session = await ai.live.connect({
    model: opts.model,
    config: {
      responseModalities: [Modality.TEXT],
      // Empty languageCodes = auto-detect, which handles Hindi/English switching mid-sentence.
      inputAudioTranscription: { languageCodes: opts.languageCodes ?? [] },
    },
    callbacks: {
      onmessage: (msg) => {
        const sc = msg.serverContent;
        if (!sc) return;
        if (sc.interimInputTranscription?.text) cb.onInterim(sc.interimInputTranscription.text);
        if (sc.inputTranscription?.text) cb.onFinal(sc.inputTranscription.text);
      },
      onerror: (e) => cb.onError(new Error(e?.message || 'Gemini Live error')),
      // Bad key, unknown model and quota errors arrive here as a close reason, not via onerror.
      onclose: (e) => {
        if (e?.code && e.code !== 1000) logger.warn('gemini live closed', { code: e.code, reason: e.reason });
        cb.onClose(e?.reason);
      },
    },
  });

  return {
    sendPcm: (chunk) =>
      session.sendRealtimeInput({
        audio: { data: chunk.toString('base64'), mimeType: 'audio/pcm;rate=16000' },
      }),
    endAudio: () => session.sendRealtimeInput({ audioStreamEnd: true }),
    close: () => session.close(),
  };
}
