/**
 * Accumulates the transcript of one recording.
 * Final segments are appended (Gemini VERBATIM mode); the interim text is the
 * speculative tail that is replaced on every update.
 */
export class TranscriptBuffer {
  constructor() {
    this.segments = [];
    this.interim = '';
  }
  setInterim(text) {
    this.interim = text.trim();
  }
  addFinal(text) {
    const t = text.trim();
    if (t) this.segments.push(t);
    this.interim = '';
  }
  /** Final text. Falls back to the last interim if the stream ended before it was finalised. */
  text() {
    return [...this.segments, this.interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
}
