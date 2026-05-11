import { defineConfig, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import JavaScriptObfuscator from 'javascript-obfuscator'

/**
 * Inline obfuscator plugin — runs `javascript-obfuscator` over each JS chunk
 * during `generateBundle`. Replaces the legacy `vite-plugin-obfuscator` package
 * which is no longer compatible with Vite 8 / Rolldown's HTML transform API.
 */
function obfuscator(opts: Parameters<typeof JavaScriptObfuscator.obfuscate>[1]): Plugin {
  return {
    name: 'threatrecon:obfuscator',
    apply: 'build',
    enforce: 'post',
    generateBundle(_outputOpts, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName]
        if (!chunk || chunk.type !== 'chunk') continue
        if (!fileName.endsWith('.js') && !fileName.endsWith('.mjs')) continue
        try {
          const result = JavaScriptObfuscator.obfuscate(chunk.code, opts).getObfuscatedCode()
          chunk.code = result
        } catch (err) {
          this.warn(`Obfuscation skipped for ${fileName}: ${(err as Error).message}`)
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'production' &&
      obfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        selfDefending: false,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
      }),
  ].filter(Boolean) as PluginOption[],
  build: {
    chunkSizeWarningLimit: 5000,
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
}))
