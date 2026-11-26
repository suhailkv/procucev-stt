import { useState } from 'react';
import { formatDuration } from '../../lib/format.js';
import { navigate } from '../../lib/router.js';
import { useLiveTranscription } from './useLiveTranscription.js';

const LANGUAGES = [
  { id: 'auto', label: 'Auto-detect (mixed)', codes: [] },
  { id: 'hi-en', label: 'Hindi + English', codes: ['hi-IN', 'en-IN'] },
  { id: 'hi', label: 'Hindi', codes: ['hi-IN'] },
  { id: 'en', label: 'English (India)', codes: ['en-IN'] },
];

const STATUS_TEXT = {
  idle: 'Ready',
  connecting: 'Connecting…',
  listening: 'Listening',
  saving: 'Finishing & saving…',
};

export default function Recorder({ onSaved }) {
  const [lang, setLang] = useState('auto');
  const t = useLiveTranscription({ onSaved });
  const active = t.status !== 'idle';
  const hasText = t.finals.length > 0 || t.interim;

  const toggle = () => {
    if (t.status === 'idle') t.start(LANGUAGES.find((l) => l.id === lang).codes);
    else t.stop();
  };

  return (
    <section className="recorder">
      <div className="recorder-controls">
        <button
          type="button"
          className={`mic-button ${t.status}`}
          onClick={toggle}
          disabled={t.status === 'saving'}
          aria-label={active ? 'Stop recording' : 'Start recording'}
          style={{ '--level': t.level }}
        >
          <span className="mic-icon" aria-hidden="true">
            {active ? '■' : '🎙'}
          </span>
        </button>
        <div className="recorder-meta">
          <span className={`status-pill ${t.status}`}>{STATUS_TEXT[t.status]}</span>
          <span className="timer">{formatDuration(t.elapsed)}</span>
          <label className="lang-select">
            <span>Language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={active}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={`transcript-panel ${active ? 'live' : ''}`} aria-live="polite">
        {hasText ? (
          <p>
            {t.finals.join(' ')} {t.interim && <span className="interim">{t.interim}</span>}
          </p>
        ) : (
          <p className="placeholder">
            {active
              ? 'Start speaking… try mixing Hindi and English, e.g. “Kal ki meeting cancel ho gayi, let’s do it on Friday.”'
              : 'Press the mic and speak. Your words appear here as you talk.'}
          </p>
        )}
      </div>

      {t.error && <p className="banner error" role="alert">{t.error}</p>}
      {t.notice && (
        <p className="banner ok">
          {t.notice}{' '}
          <button type="button" className="link" onClick={() => navigate('history')}>
            Open history →
          </button>
        </p>
      )}
    </section>
  );
}
