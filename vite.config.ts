import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Do NOT inject secret API keys into the client bundle.
      // Server-side functions (in `api/`) should read secrets from `process.env`.
      // If you need public keys for client features, prefix them with `VITE_` and
      // set them in Vercel or .env.local (local-only).
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
