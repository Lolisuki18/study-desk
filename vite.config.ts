import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Files copied as-is from public/ that the offline cache must also hold. */
const PUBLIC_FILES = ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']

/** Emits dist/sw.js: the service worker that precaches every built file so the app works offline. */
function serviceWorker(): Plugin {
  return {
    name: 'psh-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const assets = ['./', ...new Set(['index.html', ...built, ...PUBLIC_FILES])].map((f) => (f === './' ? f : `./${f}`))
      const template = readFileSync('scripts/sw-template.js', 'utf8')
      // file names carry content hashes, so this changes exactly when the build output (or the worker itself) changes
      const version = createHash('sha256').update(assets.join('|') + template).digest('hex').slice(0, 10)
      const source = template
        .replace('__VERSION__', version)
        .replace("'__ASSETS__'", JSON.stringify(assets))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  // relative paths: the build works from any folder or sub-path
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  build: {
    // the question banks are bundled on purpose (the app works offline): they are one big, rarely changing file
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // separate files keep a code change from re-downloading the question banks (and the other way round)
        manualChunks(id) {
          if (id.includes('/src/data/collections/') || id.includes('/src/data/answer-conflicts')) return 'question-banks'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router') || id.includes('node_modules/react/')) return 'react'
          if (id.includes('node_modules/lucide-react')) return 'icons'
        },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
})
