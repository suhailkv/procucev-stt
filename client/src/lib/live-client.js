export function connectLive({ languageCodes, onMessage, onClose }) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws/transcribe`);
  ws.binaryType = 'arraybuffer';

  const opened = new Promise((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', languageCodes }));
      resolve();
    };
    ws.onerror = () => reject(new Error('Could not connect to the transcription server'));
  });

  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {}
  };
  ws.onclose = () => onClose?.();

  return {
    opened,
    sendAudio: (buf) => ws.readyState === WebSocket.OPEN && ws.send(buf),
    stop: () => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'stop' })),
    close: () => ws.close(),
  };
}
