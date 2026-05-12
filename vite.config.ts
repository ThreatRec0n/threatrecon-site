import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const caseChunks = [
  './src/data/cases/case-001-resignation',
  './src/data/cases/case-002-leak',
  './src/data/cases/case-003-ghost',
  './src/data/cases/case-004-saboteur',
].map((p) => path.resolve(__dirname, `${p}.ts`));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          cases: caseChunks,
        },
      },
    },
  },
});
