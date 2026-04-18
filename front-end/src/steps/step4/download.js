/**
 * download.js — Safe download & ZIP export utilities
 *
 * Fixes:
 *   - Blob URL is revoked only after a generous delay (5 s), not synchronously
 *   - Each file download queued with staggered setTimeout to avoid browser throttle
 *   - ZIP export bundles all font files + metadata into a single .zip
 *   - Error handling: download failure is reported, not silently swallowed
 */

// ─── Single file download ─────────────────────────────────────────────────────

/**
 * Download an ArrayBuffer as a file.
 * The Blob URL is kept alive for REVOKE_DELAY ms so browsers have time to start
 * the download before the object URL is invalidated.
 *
 * @param {ArrayBuffer} buffer   - file contents
 * @param {string}      filename - suggested download filename
 * @param {string}      mime     - MIME type
 * @returns {Promise<void>}      - resolves after the click, rejects on failure
 */
export function downloadBuffer(buffer, filename, mime = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([buffer], { type: mime })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Revoke after generous delay — never synchronously
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      resolve()
    } catch (err) {
      reject(new Error(`Download failed for "${filename}": ${err.message}`))
    }
  })
}

/**
 * Download a JSON-serialisable object as .json.
 */
export function downloadJSON(obj, filename) {
  const str = JSON.stringify(obj, null, 2)
  const enc = new TextEncoder().encode(str)
  return downloadBuffer(enc.buffer, filename, 'application/json')
}

/**
 * Download a plain string as a text file.
 */
export function downloadText(text, filename) {
  const enc = new TextEncoder().encode(text)
  return downloadBuffer(enc.buffer, filename, 'text/plain;charset=utf-8')
}

// ─── Staggered multi-file download ────────────────────────────────────────────

/**
 * Download multiple files with a stagger delay between each.
 * Prevents browsers from blocking simultaneous download initiations.
 *
 * @param {{ buffer: ArrayBuffer, filename: string, mime: string }[]} files
 * @param {number} [staggerMs=500]
 * @returns {Promise<void[]>} - resolves when all downloads have been initiated
 */
export async function downloadAllStaggered(files, staggerMs = 500) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : staggerMs))
    results.push(downloadBuffer(f.buffer, f.filename, f.mime))
  }
  return Promise.all(results)
}

// ─── ZIP export ───────────────────────────────────────────────────────────────

/**
 * Bundle all font files + metadata into a single .zip archive and trigger
 * download.  Uses JSZip (must be installed: npm install jszip).
 *
 * If JSZip is not available, falls back to staggered individual downloads.
 *
 * @param {string}      fontName     - used for filenames inside the zip
 * @param {ArrayBuffer} ttfBuffer
 * @param {ArrayBuffer} woffBuffer
 * @param {object}      glyphMapObj  - JSON-serialisable glyph map
 * @param {object}      metadataObj  - JSON-serialisable metadata
 * @param {string[]}    buildLog     - build log lines to include as .txt
 * @returns {Promise<void>}
 */
export async function downloadFontZip({
  fontName,
  ttfBuffer,
  woffBuffer,
  glyphMapObj,
  metadataObj,
  buildLog = [],
}) {
  let JSZip
  try {
    JSZip = (await import('jszip')).default
  } catch {
    // JSZip not installed — fall back to individual downloads
    console.warn('[download] jszip not available, falling back to individual downloads')
    return downloadAllStaggered([
      { buffer: ttfBuffer,  filename: `${fontName}.ttf`,         mime: 'font/ttf'  },
      { buffer: woffBuffer, filename: `${fontName}.woff`,        mime: 'font/woff' },
      { buffer: new TextEncoder().encode(JSON.stringify(glyphMapObj, null, 2)).buffer,
        filename: 'glyphMap.json', mime: 'application/json' },
      { buffer: new TextEncoder().encode(JSON.stringify(metadataObj, null, 2)).buffer,
        filename: 'metadata.json', mime: 'application/json' },
    ])
  }

  const zip = new JSZip()

  // Fonts folder
  zip.file(`${fontName}.ttf`,  ttfBuffer)
  zip.file(`${fontName}.woff`, woffBuffer)

  // CSS @font-face snippet for convenience
  const cssSnippet = _generateFontFaceCSS(fontName)
  zip.file(`${fontName}-fontface.css`, cssSnippet)

  // Metadata
  zip.file('glyphMap.json',  JSON.stringify(glyphMapObj, null, 2))
  zip.file('metadata.json',  JSON.stringify(metadataObj, null, 2))

  // Install guide (Markdown)
  zip.file('INSTALL.md', _generateInstallGuide(fontName))

  // Build log
  if (buildLog.length > 0) {
    zip.file('build.log', buildLog.join('\n'))
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const url = URL.createObjectURL(zipBlob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `${fontName}-font-package.zip`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Generated file content helpers ──────────────────────────────────────────

function _generateFontFaceCSS(fontName) {
  return `/* ${fontName} — generated by Handwriting Font Generator */
@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff') format('woff'),
       url('${fontName}.ttf')  format('truetype');
  font-weight: normal;
  font-style:  normal;
  font-display: swap;
}

/* Enable OpenType features */
.handwriting {
  font-family: '${fontName}', cursive;
  /* Stylistic alternates (salt): toggle for variant style */
  font-feature-settings: "salt" 1, "calt" 1;
}

/* Thai text needs correct unicode-range and script feature */
.handwriting-thai {
  font-family: '${fontName}', cursive;
  font-feature-settings: "salt" 1, "calt" 1, "mark" 1;
  unicode-range: U+0E00-0E7F;
}
`
}

function _generateInstallGuide(fontName) {
  return `# Installing ${fontName}

## macOS
1. Double-click \`${fontName}.ttf\`
2. Click "Install Font"

## Windows
1. Right-click \`${fontName}.ttf\`
2. Select "Install" or "Install for all users"

## Linux (Ubuntu/Debian)
\`\`\`bash
mkdir -p ~/.local/share/fonts
cp ${fontName}.ttf ~/.local/share/fonts/
fc-cache -fv
\`\`\`

## Web (CSS)
Include the \`${fontName}-fontface.css\` in your HTML or copy the
\`@font-face\` block from it into your stylesheet.

Then use:
\`\`\`css
.my-text {
  font-family: '${fontName}', cursive;
  font-feature-settings: "salt" 1, "calt" 1;
}
\`\`\`

## OpenType Features
| Feature | Code | Description |
|---------|------|-------------|
| Stylistic Alternates | \`"salt" 1\` | Switch all glyphs to alt-1 variant |
| Contextual Alternates | \`"calt" 1\` | Auto-rotate variants on repeated chars |
| Mark Positioning | \`"mark" 1\` | Thai vowel & tone mark anchors (auto) |

## Notes
- Thai mark glyphs (vowels above/below, tone marks) have zero advance width
  and are positioned automatically via GPOS anchors.
- The font contains 3 variants per character: default, alt1, alt2.
`
}
