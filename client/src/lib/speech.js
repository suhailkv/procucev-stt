/**
 * lib/speech — Text-to-Speech via the browser's built-in Web Speech API
 * (free, on-device, no key). Picks a Hindi/Indian-English voice when present,
 * which reads Hinglish (mixed Hindi-English) text naturally.
 */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export const ttsSupported = Boolean(synth);

function pickVoice(text) {
  const voices = synth.getVoices();
  const hasDevanagari = /[ऀ-ॿ]/.test(text);
  const prefs = hasDevanagari ? ['hi-IN', 'en-IN'] : ['en-IN', 'hi-IN', 'en-GB', 'en-US'];
  for (const lang of prefs) {
    const v = voices.find((voice) => voice.lang.replace('_', '-') === lang);
    if (v) return v;
  }
  return null;
}

/** Speaks text; returns a promise that resolves when done or stopped. */
export function speak(text, { onEnd } = {}) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(text);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = 1;
  u.onend = u.onerror = () => onEnd?.();
  synth.speak(u);
}

export function stopSpeaking() {
  synth?.cancel();
}
