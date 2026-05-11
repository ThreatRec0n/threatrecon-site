import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom') ||
            id.includes('react-router')
          )
            return 'vendor'
          if (id.includes('@xterm')) return 'xterm'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'
          if (id.includes('recharts')) return 'charts'
          return undefined
        },
      },
    },
  },
})
