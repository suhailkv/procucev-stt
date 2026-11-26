import { useState } from 'react';
import Dashboard from './features/dashboard/Dashboard.jsx';
import Recorder from './features/recorder/Recorder.jsx';
import { navigate, useRoute } from './lib/router.js';

export default function App() {
  const route = useRoute();
  const [refreshKey, setRefreshKey] = useState(0);

  const onSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#/record">
          <span className="brand-mark">बोलो</span> Bolo
        </a>
        <nav>
          <button type="button" className={route === 'record' ? 'active' : ''} onClick={() => navigate('record')}>
            Record
          </button>
          <button type="button" className={route === 'history' ? 'active' : ''} onClick={() => navigate('history')}>
            History
          </button>
        </nav>
      </header>

      <main>
        {route === 'history' ? (
          <>
            <h1>Transcription history</h1>
            <Dashboard refreshKey={refreshKey} />
          </>
        ) : (
          <>
            <h1>
              Speak in Hindi, English — <em>ya dono mein.</em>
            </h1>
            <p className="lede">Real-time transcription that keeps up with how you actually talk.</p>
            <Recorder onSaved={onSaved} />
          </>
        )}
      </main>

      <footer className="site-footer">
        Speech-to-text by Gemini Live · Text-to-speech by your browser · Built by Suhail KV
      </footer>
    </div>
  );
}
