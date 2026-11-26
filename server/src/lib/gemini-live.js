/**
 * lib/gemini-live — wraps `@google/genai` (Gemini Live API) for streaming STT.
 * Exposes a tiny session object: push PCM chunks in, get interim/final text out.
 *
 * Audio format expected by Gemini: raw 16-bit little-endian mono PCM @ 16 kHz.
 */
import { GoogleGenAI, Modality } from '@google/genai';
import { logger } from './logger.js';

/**
 * @param {{ apiKey: string, model: string, languageCodes?: string[] }} opts
 *   languageCodes: BCP-47 hints e.g. ['hi-IN','en-IN']; empty = auto-detect + code-switching.
 * @param {{ onInterim(t:string):void, onFinal(t:string):void, onError(e:Error):void, onClose():void }} cb
 */
export async function openLiveTranscription(opts, cb) {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey, httpOptions: { apiVersion: 'v1beta' } });

  const session = await ai.live.connect({
    model: opts.model,
    config: {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: { languageCodes: opts.languageCodes ?? [] },
    },
    callbacks: {
      onmessage: (msg) => {
        const sc = msg.serverContent;
        if (!sc) return;
        // interim = speculative text while the user is still speaking
        if (sc.interimInputTranscription?.text) cb.onInterim(sc.interimInputTranscription.text);
        // inputTranscription = finalised segment (after a pause / turn end)
        if (sc.inputTranscription?.text) cb.onFinal(sc.inputTranscription.text);
      },
      onerror: (e) => cb.onError(new Error(e?.message || 'Gemini Live error')),
      onclose: (e) => {
        // Config / model / quota problems usually arrive as a close reason, not onerror.
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
