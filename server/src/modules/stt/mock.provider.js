const WORDS = ['[mock]', 'namaste', 'hello', 'aaj', 'meeting', 'hai', 'at', 'five', 'pm'];
const SILENCE_RMS = 500; // 16-bit scale, 0..32767

export function pcmRms(chunk) {
  const samples = Math.floor(chunk.length / 2);
  if (!samples) return 0;
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const s = chunk.readInt16LE(i * 2);
    sum += s * s;
  }
  return Math.sqrt(sum / samples);
}

export const mockProvider = {
  name: 'mock',
  async open(_opts, cb) {
    let voiced = 0;
    let closed = false;
    return {
      sendPcm(chunk) {
        if (pcmRms(chunk) < SILENCE_RMS) return;
        voiced += 1;
        const word = WORDS[Math.floor(voiced / 5) % WORDS.length];
        if (voiced % 5 === 0) cb.onFinal(word);
        else cb.onInterim(word);
      },
      endAudio() {},
      close() {
        if (closed) return;
        closed = true;
        cb.onClose();
      },
    };
  },
};
