/**
 * Orchestrates one recording: mic → WebSocket → live text → saved record.
 * status: idle → connecting → listening → saving → idle
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectLive } from '../../lib/live-client.js';
import { describeMicError, startMicrophone } from '../../lib/microphone.js';

export function useLiveTranscription({ onSaved } = {}) {
  const [status, setStatus] = useState('idle');
  const [finals, setFinals] = useState([]);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const live = useRef(null);
  const mic = useRef(null);
  const statusRef = useRef('idle');
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const setPhase = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  const teardown = useCallback(async () => {
    const m = mic.current;
    mic.current = null;
    await m?.stop().catch(() => {});
    live.current?.close();
    live.current = null;
    setLevel(0);
    setInterim('');
    setPhase('idle');
  }, []);

  const handleMessage = useCallback(
    (msg) => {
      switch (msg.type) {
        case 'ready':
          setPhase('listening');
          break;
        case 'interim':
          setInterim(msg.text);
          break;
        case 'final':
          setFinals((f) => [...f, msg.text.trim()].filter(Boolean));
          setInterim('');
          break;
        case 'saved':
          setNotice('Saved to your history');
          onSavedRef.current?.(msg.transcription);
          teardown();
          break;
        case 'empty':
          setNotice('Nothing was recognised, so nothing was saved.');
          teardown();
          break;
        case 'error':
          setError(msg.message);
          if (statusRef.current !== 'listening') teardown();
          break;
        default:
      }
    },
    [teardown],
  );

  const start = useCallback(
    async (languageCodes) => {
      if (statusRef.current !== 'idle') return;
      setFinals([]);
      setInterim('');
      setError('');
      setNotice('');
      setElapsed(0);
      setPhase('connecting');
      try {
        live.current = connectLive({
          languageCodes,
          onMessage: handleMessage,
          onClose: () => {
            if (statusRef.current !== 'idle') {
              if (statusRef.current === 'listening') setError('Connection to the server was lost');
              teardown();
            }
          },
        });
        await live.current.opened;
        mic.current = await startMicrophone({
          onChunk: (buf) => live.current?.sendAudio(buf),
          onLevel: setLevel,
        });
      } catch (err) {
        setError(describeMicError(err));
        teardown();
      }
    },
    [handleMessage, teardown],
  );

  const stop = useCallback(async () => {
    if (!['listening', 'connecting'].includes(statusRef.current)) return;
    setPhase('saving');
    const m = mic.current;
    mic.current = null;
    await m?.stop().catch(() => {});
    setLevel(0);
    live.current?.stop();
  }, []);

  // Recording timer
  useEffect(() => {
    if (status !== 'listening') return undefined;
    const startedAt = Date.now() - elapsed;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Release mic/socket if the component unmounts mid-recording
  useEffect(() => () => void teardown(), [teardown]);

  return { status, finals, interim, error, notice, level, elapsed, start, stop };
}
