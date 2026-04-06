/**
 * vite.config.js
 *
 * Vite build configuration for the React client.
 *
 * Plugins:
 *   react          — JSX transform + Fast Refresh during development
 *   tailwindcss    — Tailwind v4 via the official Vite plugin (no postcss config needed)
 *
 * Dev server:
 *   port 5173
 *   /api proxy → http://localhost:5000  (avoids CORS issues in development)
 *
 * Test (Vitest):
 *   environment: jsdom  — simulates a browser DOM for component tests
 *   globals: true       — makes describe/it/expect available without explicit imports
 *   setupFiles          — runs @testing-library/jest-dom matchers before every test file
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
