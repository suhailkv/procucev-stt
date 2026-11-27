import { attachWebSocket } from '../../lib/websocket.js';
import { handleLiveSocket } from './live.socket.js';

export const LIVE_PATH = '/ws/transcribe';

export function attachLiveTranscription(httpServer, deps) {
  return attachWebSocket(httpServer, LIVE_PATH, (socket) => handleLiveSocket(socket, deps));
}

export { handleLiveSocket };
