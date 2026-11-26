/**
 * AudioWorklet: converts the mic's native-rate Float32 audio into
 * 16 kHz / 16-bit / mono PCM chunks (~100 ms) and posts them to the main thread,
 * together with an RMS level for the input meter.
 */
const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 1600; // 100 ms @ 16 kHz

class PcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE; // `sampleRate` is a worklet global
    this.pos = 0; // fractional read position into the incoming stream
    this.out = new Int16Array(CHUNK_SAMPLES);
    this.outLen = 0;
    this.sumSq = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    // Linear-interpolation resampler: walk the input in steps of `ratio`.
    while (this.pos < channel.length - 1) {
      const i = Math.floor(this.pos);
      const frac = this.pos - i;
      const s = channel[i] + (channel[i + 1] - channel[i]) * frac;
      const clamped = Math.max(-1, Math.min(1, s));
      this.out[this.outLen++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      this.sumSq += clamped * clamped;

      if (this.outLen === CHUNK_SAMPLES) {
        const pcm = this.out.buffer.slice(0);
        this.port.postMessage({ pcm, level: Math.sqrt(this.sumSq / CHUNK_SAMPLES) }, [pcm]);
        this.outLen = 0;
        this.sumSq = 0;
      }
      this.pos += this.ratio;
    }
    this.pos -= channel.length;
    return true;
  }
}

registerProcessor('pcm-recorder', PcmRecorder);
