import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
// Exercise the deployed security policy in browser tests, not just the dev server.
const deployment = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const productionHeaders = Object.fromEntries(
  deployment.headers[0].headers.map((header: { key: string; value: string }) => [
    header.key,
    header.value,
  ]),
);
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, headers: productionHeaders },
  build: {
    // Keep bundled fonts as same-origin files, consistent with font-src 'self'.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          three: [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            '@react-three/postprocessing',
          ],
          charts: ['echarts', 'echarts-for-react'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    restoreMocks: true,
  },
});
