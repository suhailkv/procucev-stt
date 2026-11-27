import { readFileSync } from 'node:fs';

const [file, url = 'ws://localhost:4000/ws/transcribe'] = process.argv.slice(2);
if (!file) {
  console.error('usage: node scripts/smoke-live.js file.wav [ws-url]');
  process.exit(1);
}

function wavPcm(buf) {
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') {
      const rate = buf.readUInt32LE(off + 12);
      const bits = buf.readUInt16LE(off + 22);
      const ch = buf.readUInt16LE(off + 10);
      if (rate !== 16000 || bits !== 16 || ch !== 1) throw new Error(`need 16kHz/16-bit/mono, got ${rate}/${bits}/${ch}`);
    }
    if (id === 'data') return buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

const pcm = Buffer.concat([wavPcm(readFileSync(file)), Buffer.alloc(32000)]);
const ws = new WebSocket(url);
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

ws.onopen = () => ws.send(JSON.stringify({ type: 'start' }));
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  log(msg.type, msg.text ?? msg.message ?? (msg.transcription ? JSON.stringify(msg.transcription) : ''));
  if (msg.type === 'ready') {
    let off = 0;
    const timer = setInterval(() => {
      if (off >= pcm.length) {
        clearInterval(timer);
        log('→ stop');
        ws.send(JSON.stringify({ type: 'stop' }));
        return;
      }
      ws.send(pcm.subarray(off, off + 3200));
      off += 3200;
    }, 100);
  }
  if (['saved', 'empty'].includes(msg.type) || (msg.type === 'error' && !msg.text)) ws.close();
};
ws.onclose = () => process.exit(0);
ws.onerror = () => {
  console.error('socket error');
  process.exit(1);
};
