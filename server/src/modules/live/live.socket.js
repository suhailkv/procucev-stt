/**
 * Real-time transcription over WebSocket.
 *
 * Client → server
 *   {"type":"start","languageCodes":["hi-IN","en-IN"]}   (languageCodes optional)
 *   <binary frames>  16 kHz / 16-bit LE / mono PCM, ~100 ms each
 *   {"type":"stop"}
 *
 * Server → client
 *   {"type":"ready"}                       STT session open, keep streaming
 *   {"type":"interim","text"}              speculative text (replace)
 *   {"type":"final","text"}                finalised segment (append)
 *   {"type":"saved","transcription"}       stored in DB after stop
 *   {"type":"empty"}                       nothing was recognised, not saved
 *   {"type":"error","message"}
 */
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';
import { z } from '../../lib/validation.js';
import { getSttProvider } from '../stt/index.js';
import { transcriptionService } from '../transcriptions/index.js';
import { TranscriptBuffer } from './transcript-buffer.js';

const BYTES_PER_SECOND = 16000 * 2; // 16 kHz × 16-bit
const FLUSH_IDLE_MS = 1200; // after stop: wait this long after the last final…
const FLUSH_MAX_MS = 4000; // …but never longer than this
const MAX_PENDING_CHUNKS = 50; // audio buffered while the STT session is connecting (~5 s)

const startMsg = z.object({
  type: z.literal('start'),
  languageCodes: z.array(z.string().max(16)).max(5).optional(),
});
const stopMsg = z.object({ type: z.literal('stop') });

export function handleLiveSocket(socket, { provider = getSttProvider(), save = transcriptionService.create } = {}) {
  /** @type {'idle'|'connecting'|'streaming'|'stopping'|'done'} */
  let state = 'idle';
  let stt = null;
  let bytes = 0;
  let languageCodes = [];
  let pending = [];
  let lastFinalAt = 0;
  let maxTimer = null;
  const transcript = new TranscriptBuffer();

  const fail = (message) => {
    socket.sendJson({ type: 'error', message });
    cleanup();
  };

  const cleanup = () => {
    state = 'done';
    clearTimeout(maxTimer);
    try {
      stt?.close();
    } catch {
      /* already closed */
    }
    stt = null;
  };

  async function start(msg) {
    if (state !== 'idle') return fail('Session already started');
    state = 'connecting';
    languageCodes = msg.languageCodes ?? [];
    try {
      stt = await provider.open(
        { languageCodes },
        {
          onInterim: (text) => {
            transcript.setInterim(text);
            socket.sendJson({ type: 'interim', text });
          },
          onFinal: (text) => {
            transcript.addFinal(text);
            lastFinalAt = Date.now();
            socket.sendJson({ type: 'final', text });
          },
          onError: (err) => {
            logger.warn('stt error', { err: err.message });
            socket.sendJson({ type: 'error', message: 'Speech service error' });
          },
          onClose: () => {
            if (state === 'streaming') stop(); // upstream closed on us → save what we have
          },
        },
      );
    } catch (err) {
      logger.error('stt open failed', { err: err.message });
      return fail(err.message.includes('GEMINI_API_KEY') ? err.message : 'Could not start speech service');
    }
    if (state !== 'connecting') return cleanup(); // client left / stopped while connecting
    state = 'streaming';
    pending.forEach((c) => stt.sendPcm(c));
    pending = [];
    maxTimer = setTimeout(() => {
      socket.sendJson({ type: 'error', message: 'Maximum recording length reached' });
      stop();
    }, env.MAX_SESSION_SECONDS * 1000);
    socket.sendJson({ type: 'ready' });
  }

  function audio(chunk) {
    if (chunk.length % 2 !== 0) return; // not 16-bit PCM
    bytes += chunk.length;
    if (state === 'streaming') stt.sendPcm(chunk);
    else if (state === 'connecting' && pending.length < MAX_PENDING_CHUNKS) pending.push(chunk);
  }

  async function stop() {
    if (state === 'connecting') {
      state = 'stopping';
      socket.sendJson({ type: 'empty' });
      return cleanup();
    }
    if (state !== 'streaming') return;
    state = 'stopping';
    clearTimeout(maxTimer);
    try {
      stt.endAudio();
    } catch {
      /* ignore */
    }
    await waitForFlush();

    const content = transcript.text();
    cleanup();
    if (!content) return socket.sendJson({ type: 'empty' });
    try {
      const saved = await save({
        content,
        language: languageCodes.length ? languageCodes.join(',') : 'auto',
        source: 'live',
        durationMs: Math.round((bytes / BYTES_PER_SECOND) * 1000),
      });
      socket.sendJson({ type: 'saved', transcription: saved });
    } catch (err) {
      logger.error('save failed', { err: err.message });
      socket.sendJson({ type: 'error', message: 'Could not save transcription', text: content });
    }
  }

  /** Give the STT engine a moment to emit the last finalised segment. */
  function waitForFlush() {
    const started = Date.now();
    lastFinalAt = Math.max(lastFinalAt, started);
    return new Promise((resolve) => {
      const tick = setInterval(() => {
        const now = Date.now();
        if (now - lastFinalAt >= FLUSH_IDLE_MS || now - started >= FLUSH_MAX_MS) {
          clearInterval(tick);
          resolve();
        }
      }, 100);
    });
  }

  socket.onText((raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return socket.sendJson({ type: 'error', message: 'Invalid JSON' });
    }
    if (startMsg.safeParse(msg).success) return void start(msg);
    if (stopMsg.safeParse(msg).success) return void stop();
    socket.sendJson({ type: 'error', message: 'Unknown message type' });
  });
  socket.onBinary(audio);
  socket.onClose(() => {
    // Client vanished mid-recording: still persist what was transcribed.
    if (state === 'streaming') void stop();
    else cleanup();
  });
}
