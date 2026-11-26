import { useEffect, useState } from 'react';
import { speak, stopSpeaking, ttsSupported } from '../lib/speech.js';

/** Reads text aloud (Text-to-Speech) with a play/stop toggle. */
export default function SpeakButton({ text }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => playing && stopSpeaking(), [playing]);
  if (!ttsSupported) return null;

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      setPlaying(true);
      speak(text, { onEnd: () => setPlaying(false) });
    }
  };

  return (
    <button type="button" className="btn ghost" onClick={toggle} title="Read aloud">
      {playing ? '■ Stop' : '▶ Listen'}
    </button>
  );
}
