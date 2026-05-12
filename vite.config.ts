import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-xterm': [
            '@xterm/xterm',
            '@xterm/addon-fit',
            '@xterm/addon-web-links',
            '@xterm/addon-search',
          ],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          'case-001': ['./src/data/cases/case-001-resignation'],
          'case-002': ['./src/data/cases/case-002-leak'],
          'case-003': ['./src/data/cases/case-003-ghost'],
          'case-004': ['./src/data/cases/case-004-saboteur'],
        },
      },
    },
  },
});
