import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─── Vite Config — P0.2 Bundle Size Reduction ────────────────────────────────
// Manual chunks keep main.js < 350KB by splitting heavy deps into lazy chunks.
// Each chunk loads only when the step that needs it is opened.
//
// Target chunk map:
//   main.js     < 350KB  — React + core app shell
//   pdf.js      lazy     — pdfjs-dist (Step 2 only)
//   font.js     lazy     — opentype.js (Step 4 only)
//   zip.js      lazy     — jszip (Step 4 ZIP export)
//   canvas.js   lazy     — html2canvas (Step 5 PNG export)
//
// Measure with: npx vite-bundle-visualizer

export default defineConfig({
  plugins: [react()],

  build: {
    // Raise warning limit — large chunks will be split anyway
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Heavy PDF library — only loaded in Step 2 ───────────────────
          if (id.includes('pdfjs-dist')) {
            return 'pdf'
          }

          // ── Font compilation — only loaded in Step 4 ────────────────────
          if (id.includes('opentype')) {
            return 'font'
          }

          // ── ZIP bundling — loaded on Step 4 export ──────────────────────
          if (id.includes('jszip')) {
            return 'zip'
          }

          // ── Canvas export — loaded on Step 5 PNG export ─────────────────
          if (id.includes('html2canvas')) {
            return 'canvas'
          }

          // ── PDF generation — loaded on Step 5 PDF export ────────────────
          if (id.includes('jspdf')) {
            return 'canvas'  // bundle with html2canvas (both Step 5 only)
          }

          // ── React core — always needed, cache-friendly chunk ─────────────
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }

          // ── Analytics — loaded async, separate chunk ─────────────────────
          if (id.includes('posthog-js')) {
            return 'analytics'
          }

          // ── Supabase auth — Phase 2 ──────────────────────────────────────
          if (id.includes('@supabase')) {
            return 'auth'
          }
        },
      },
    },
  },

  // ── Dev server ──────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    open: false,
  },

  // ── Optimize pre-bundling — exclude heavy lazy deps from dev pre-bundle ────
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
