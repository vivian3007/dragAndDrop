import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Grote bibliotheken in eigen bestanden: die veranderen zelden, dus de browser kan ze in de
// cache houden als alleen de app-code verandert. three.js zit hier bewust niet bij; dat laadt
// pas mee met de editor/patroonpagina (zie lazy() in App.tsx en Pattern.tsx).
function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\/(@firebase|firebase)\//.test(id)) return 'firebase'
  if (/node_modules\/(@mui|@emotion|@popperjs|react-transition-group|stylis)\//.test(id)) return 'mui'
  if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
  return undefined
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@react-three/drei', '@react-three/fiber', 'three', 'three-csg-ts'],
  },
  // Unit tests (npm test). De emulatortests in scripts/ draaien apart: npm run test:emulator.
  test: {
    include: ['src/**/*.test.ts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
