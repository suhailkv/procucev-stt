import { describe, expect, it, vi } from 'vitest';
import { handleLiveSocket } from '../src/modules/live/live.socket.js';
import { TranscriptBuffer } from '../src/modules/live/transcript-buffer.js';
import { mockProvider } from '../src/modules/stt/mock.provider.js';

function fakeSocket() {
  const handlers = { text: [], bin: [], close: [] };
  const sent = [];
  return {
    sent,
    sendJson: (m) => sent.push(m),
    close: () => {},
    onText: (cb) => handlers.text.push(cb),
    onBinary: (cb) => handlers.bin.push(cb),
    onClose: (cb) => handlers.close.push(cb),
    isOpen: true,
    text: (obj) => handlers.text.forEach((cb) => cb(JSON.stringify(obj))),
    audio: (buf) => handlers.bin.forEach((cb) => cb(buf)),
    disconnect: () => handlers.close.forEach((cb) => cb()),
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const silence = Buffer.alloc(3200);
const chunk = Buffer.alloc(3200);
for (let i = 0; i < 1600; i++) chunk.writeInt16LE(i % 20 < 10 ? 8000 : -8000, i * 2);

describe('TranscriptBuffer', () => {
  it('appends finals and falls back to the trailing interim', () => {
    const b = new TranscriptBuffer();
    b.addFinal(' Kal meeting ');
    b.addFinal('hai at 5');
    b.setInterim('please');
    expect(b.text()).toBe('Kal meeting hai at 5 please');
  });
});

describe('live socket', () => {
  it('streams interim/final text and saves the transcript on stop', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const socket = fakeSocket();
    const save = vi.fn(async (t) => ({ id: 1, ...t }));
    handleLiveSocket(socket, { provider: mockProvider, save });

    socket.text({ type: 'start' });
    await tick();
    expect(socket.sent[0]).toEqual({ type: 'ready' });

    for (let i = 0; i < 10; i++) socket.audio(chunk);
    expect(socket.sent.some((m) => m.type === 'interim')).toBe(true);
    expect(socket.sent.filter((m) => m.type === 'final')).toHaveLength(2);

    socket.text({ type: 'stop' });
    await vi.advanceTimersByTimeAsync(5000);

    expect(save).toHaveBeenCalledWith({
      content: 'namaste hello',
      language: 'auto',
      source: 'live',
      durationMs: 1000,
    });
    expect(socket.sent.at(-1).type).toBe('saved');
    vi.useRealTimers();
  });

  it('mock engine ignores silence', async () => {
    const socket = fakeSocket();
    handleLiveSocket(socket, { provider: mockProvider, save: vi.fn() });
    socket.text({ type: 'start' });
    await tick();
    for (let i = 0; i < 20; i++) socket.audio(silence);
    expect(socket.sent.filter((m) => m.type !== 'ready')).toEqual([]);
  });

  it('buffers audio sent while the STT session is still connecting', async () => {
    const socket = fakeSocket();
    const sendPcm = vi.fn();
    const slowProvider = { open: async () => ({ sendPcm, endAudio() {}, close() {} }) };
    handleLiveSocket(socket, { provider: slowProvider, save: vi.fn() });

    socket.text({ type: 'start' });
    socket.audio(chunk);
    socket.audio(chunk);
    await tick();
    expect(sendPcm).toHaveBeenCalledTimes(2);
  });

  it('reports provider start-up failures to the client', async () => {
    const socket = fakeSocket();
    const broken = { open: async () => { throw new Error('boom'); } };
    handleLiveSocket(socket, { provider: broken, save: vi.fn() });
    socket.text({ type: 'start' });
    await tick();
    expect(socket.sent).toEqual([{ type: 'error', message: 'Could not start speech service' }]);
  });

  it('rejects unknown messages and does not save empty recordings', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const socket = fakeSocket();
    const save = vi.fn();
    handleLiveSocket(socket, { provider: mockProvider, save });
    socket.text({ type: 'dance' });
    expect(socket.sent[0]).toEqual({ type: 'error', message: 'Unknown message type' });

    socket.text({ type: 'start' });
    await tick();
    socket.text({ type: 'stop' });
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).not.toHaveBeenCalled();
    expect(socket.sent.at(-1)).toEqual({ type: 'empty' });
    vi.useRealTimers();
  });
});
