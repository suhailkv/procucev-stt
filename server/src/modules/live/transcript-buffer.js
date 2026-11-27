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
  text() {
    return [...this.segments, this.interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }
}
