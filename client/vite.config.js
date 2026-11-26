import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, Vite proxies API + WebSocket calls to the Node server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws': { target: 'ws://localhost:4000', ws: true },
    },
  },
});
