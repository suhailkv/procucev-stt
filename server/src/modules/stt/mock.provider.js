/**
 * Offline STT provider for tests and demos without an API key.
 * Emits one interim per chunk and a final word every 5 chunks.
 */
const WORDS = ['namaste', 'hello', 'aaj', 'meeting', 'hai', 'at', 'five', 'pm'];

export const mockProvider = {
  name: 'mock',
  async open(_opts, cb) {
    let chunks = 0;
    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      cb.onClose();
    };
    return {
      sendPcm() {
        chunks += 1;
        const word = WORDS[Math.floor(chunks / 5) % WORDS.length];
        if (chunks % 5 === 0) cb.onFinal(word);
        else cb.onInterim(word);
      },
      endAudio() {},
      close: finish,
    };
  },
};
