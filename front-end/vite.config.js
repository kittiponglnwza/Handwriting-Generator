import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Test ────────────────────────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'node',
  },

  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist'))   return 'pdf'
          if (id.includes('opentype'))     return 'font'
          if (id.includes('jszip'))        return 'zip'
          if (id.includes('html2canvas'))  return 'canvas'
          if (id.includes('jspdf'))        return 'canvas'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
          if (id.includes('posthog-js'))   return 'analytics'
          if (id.includes('@supabase'))    return 'auth'
        },
      },
    },
  },

  server: {
    port: 5173,
    open: false,
  },

  optimizeDeps: {
    exclude: [
      'pdfjs-dist',
      'opentype.js',
      'jszip',
      'html2canvas',
      'jspdf',
      'posthog-js',
    ],
  },
})