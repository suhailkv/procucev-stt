import { WebSocketServer, WebSocket } from 'ws';

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data);
}

export function attachWebSocket(server, path, onConnection) {
  const wss = new WebSocketServer({ server, path, maxPayload: 1024 * 1024 });

  wss.on('connection', (ws) => {
    const textCbs = [];
    const binCbs = [];
    const closeCbs = [];

    ws.on('message', (data, isBinary) => {
      if (isBinary) binCbs.forEach((cb) => cb(toBuffer(data)));
      else textCbs.forEach((cb) => cb(toBuffer(data).toString('utf8')));
    });
    ws.on('close', () => closeCbs.forEach((cb) => cb()));
    ws.on('error', () => ws.terminate());

    const makeSocket = () => ({
      sendJson: (obj) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(obj)),
      close: (code, reason) => ws.close(code, reason),
      onText: (cb) => textCbs.push(cb),
      onBinary: (cb) => binCbs.push(cb),
      onClose: (cb) => closeCbs.push(cb),
      get isOpen() {
        return ws.readyState === WebSocket.OPEN;
      },
    });

    onConnection(makeSocket());
  });

  return { close: () => new Promise((resolve) => wss.close(() => resolve())) };
}
