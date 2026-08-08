import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// Set TUNNEL_HOST to the ngrok hostname (no scheme) when running the dev server
// behind a tunnel. Vite otherwise rejects the forwarded Host header, and the HMR
// socket would try to reach ws://localhost:5173 from a public origin.
const tunnelHost = process.env.TUNNEL_HOST?.replace(/^https?:\/\//, '').replace(/\/$/, '');

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    port: 5173,
    allowedHosts: tunnelHost ? [tunnelHost] : undefined,
    hmr: tunnelHost ? { protocol: 'wss', host: tunnelHost, clientPort: 443 } : undefined,
    proxy: {
      '/api': {
        // Server-side only: must not be VITE_ prefixed or it would leak into the client
        // bundle and override the relative /api base URL the browser needs.
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
