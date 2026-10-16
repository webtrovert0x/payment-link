import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wagmi/core/tempo': path.resolve(import.meta.dirname, 'src/shims/tempo.js'),
    },
  },
});
