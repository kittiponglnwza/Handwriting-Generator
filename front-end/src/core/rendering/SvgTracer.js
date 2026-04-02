export function traceToSVGPath(inkCanvas, width, height, options = {}) {
  try {
    const ctx2 = inkCanvas.getContext("2d")
    if (!ctx2) return null

    const imageData = ctx2.getImageData(0, 0, width, height)
    const { data } = imageData

    const threshold = 180
    const mask = new Uint8Array(width * height)

    let inkCount = 0
    let minX = width, minY = height, maxX = 0, maxY = 0
    
    // First pass: create mask and find actual ink bounds
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
        if (a < 50) {
          mask[y * width + x] = 0
          continue
        }
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722
        const isInk = lum < threshold ? 1 : 0
        mask[y * width + x] = isInk
        inkCount += isInk
        
        // Track ink bounds for normalization
        if (isInk) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    // [FIX #2] ลบ early-exit ที่ผิดออก เช็คทีเดียวหลังสแกนครบ
    if (inkCount < 10) return null

    // Calculate actual glyph dimensions
    const glyphWidth = maxX - minX + 1
    const glyphHeight = maxY - minY + 1
    
    // Apply visual normalization
    const normalizedViewBox = calculateNormalizedViewBox(
      glyphWidth, glyphHeight, minX, minY, width, height, options
    )
    
    // Use normalized coordinates for SVG path
    const { scaleX, scaleY, offsetX, offsetY } = normalizedViewBox.transform

    const pathCmds = []
    const STEP = Math.max(1, Math.floor(Math.min(width, height) / 80))

    // [FIX #1] จัด brace ให้ถูกต้อง — ทุกอย่างอยู่ใน for-y loop
    let prevRuns = []
    for (let y = 0; y < height; y += STEP) {
      const runs = []
      let inRun = false
      let runStart = 0

      for (let x = 0; x < width; x++) {
        const isInk = mask[y * width + x] === 1
        if (isInk && !inRun) {
          inRun = true
          runStart = x
        } else if (!isInk && inRun) {
          inRun = false
          runs.push({ start: runStart, end: x - 1 })
        }
      }
      // ปิด run ที่ยังค้างอยู่ตอนสิ้นสุดแถว
      if (inRun) runs.push({ start: runStart, end: width - 1 })

      for (const run of runs) {
        const midX = ((run.start + run.end) / 2 * scaleX + offsetX).toFixed(1)
        const midY = (y * scaleY + offsetY).toFixed(1)

        const matched = prevRuns.find(
          pr => pr.start <= run.end + STEP * 2 && pr.end >= run.start - STEP * 2
        )

        if (matched) {
          const prevMidX = ((matched.start + matched.end) / 2 * scaleX + offsetX).toFixed(1)
          const prevMidY = ((y - STEP) * scaleY + offsetY).toFixed(1)
          pathCmds.push(`M ${prevMidX} ${prevMidY} L ${midX} ${midY}`)
        } else {
          const x1 = (run.start * scaleX + offsetX).toFixed(1)
          const x2 = (run.end * scaleX + offsetX).toFixed(1)
          pathCmds.push(`M ${x1} ${midY} L ${x2} ${midY}`)
        }
      }

      prevRuns = runs
    }

    if (pathCmds.length === 0) return null

    return {
      path: pathCmds.join(" "),
      viewBox: normalizedViewBox.viewBox,
      glyphMetrics: {
        width: glyphWidth,
        height: glyphHeight,
        normalizedHeight: normalizedViewBox.targetHeight
      }
    }
  } catch (error) {
    console.error('Error in traceToSVGPath:', error)
    return null
  }
}

// ─── Visual Normalization ─────────────────────────────────────────────────────
// Calculate median height of base consonants for consistent visual scaling
const BASE_CONSONANTS = new Set([
  0x0e01, 0x0e02, 0x0e03, 0x0e04, 0x0e05, 0x0e06, 0x0e07, 0x0e08, 0x0e09, 0x0e0a,
  0x0e0b, 0x0e0c, 0x0e0d, 0x0e0e, 0x0e0f, 0x0e10, 0x0e11, 0x0e12, 0x0e13, 0x0e14,
  0x0e15, 0x0e16, 0x0e17, 0x0e18, 0x0e19, 0x0e1a, 0x0e1b, 0x0e1c, 0x0e1d, 0x0e1e,
  0x0e1f, 0x0e20, 0x0e21, 0x0e22, 0x0e23, 0x0e24, 0x0e25, 0x0e26, 0x0e27, 0x0e28,
  0x0e29, 0x0e2a, 0x0e2b, 0x0e2c, 0x0e2d, 0x0e2e
])

let medianConsonantHeight = null

function updateMedianConsonantHeight(glyphs) {
  const consonantHeights = []
  
  for (const glyph of glyphs) {
    if (!glyph.ch) continue
    const cp = glyph.ch.codePointAt(0)
    if (!BASE_CONSONANTS.has(cp)) continue
    
    const metrics = glyph.glyphMetrics
    if (metrics && metrics.height > 0) {
      consonantHeights.push(metrics.height)
    }
  }
  
  if (consonantHeights.length > 0) {
    consonantHeights.sort((a, b) => a - b)
    const mid = Math.floor(consonantHeights.length / 2)
    medianConsonantHeight = consonantHeights.length % 2 === 0
      ? (consonantHeights[mid - 1] + consonantHeights[mid]) / 2
      : consonantHeights[mid]
  }
}

function calculateNormalizedViewBox(glyphWidth, glyphHeight, minX, minY, canvasWidth, canvasHeight, options = {}) {
  // Target height: median consonant height or fallback
  const targetHeight = medianConsonantHeight || Math.round(glyphHeight * 0.8)
  
  // Ignore extreme outliers (tone marks, long strokes)
  const heightRatio = glyphHeight / targetHeight
  const normalizedHeight = heightRatio > 2.5 ? targetHeight : glyphHeight
  
  // Calculate scale to fit normalized height in 100-unit viewBox
  const scale = normalizedHeight > 0 ? 80 / normalizedHeight : 1
  
  // Center the glyph in the viewBox with consistent baseline
  const normalizedWidth = glyphWidth * scale
  const viewBoxWidth = Math.max(normalizedWidth, 20) // Minimum width
  const viewBoxHeight = 100 // Fixed height for consistency
  
  // Center horizontally, align to baseline (bottom 20% reserved for descenders)
  const offsetX = -minX * scale + (viewBoxWidth - normalizedWidth) / 2
  const offsetY = -minY * scale + (viewBoxHeight - normalizedHeight) * 0.8
  
  return {
    viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
    transform: {
      scaleX: scale,
      scaleY: scale,
      offsetX,
      offsetY
    },
    targetHeight: normalizedHeight
  }
}

function getMedianConsonantHeight() {
  return medianConsonantHeight
}

export async function traceAllGlyphs(rawGlyphs) {
  const BATCH_SIZE = 8
  const results = []

  try {
    // First pass: trace all glyphs to get metrics for median calculation
    const tracedGlyphs = []
    
    for (let i = 0; i < rawGlyphs.length; i += BATCH_SIZE) {
      const batch = rawGlyphs.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.all(
        batch.map(async g => {
          if (!g._inkCanvas || g.status === "missing") {
            const { _inkCanvas, _inkW, _inkH, ...rest } = g
            return { ...rest, svgPath: null, viewBox: "0 0 100 100" }
          }

          // [FIX #4] destructure ก่อน try/catch เพื่อให้ catch block เข้าถึง rest ได้
          const { _inkCanvas, _inkW, _inkH, ...rest } = g

          return new Promise(resolve => {
            const scheduleTrace = () => {
              setTimeout(() => {
                try {
                  const traced = traceToSVGPath(g._inkCanvas, g._inkW, g._inkH, { ch: g.ch })
                  tracedGlyphs.push({ ...rest, ...traced, ch: g.ch })
                  resolve({
                    ...rest,
                    svgPath: traced?.path || null,
                    viewBox: traced?.viewBox || "0 0 100 100",
                    glyphMetrics: traced?.glyphMetrics
                  })
                } catch (error) {
                  console.error('Error tracing glyph:', error)
                  resolve({
                    ...rest,
                    svgPath: null,
                    viewBox: "0 0 100 100"
                  })
                }
              }, 0)
            }

            // [FIX #3] ลบ scheduleTrace() ที่เรียกซ้ำนอก Promise ออก
            if (window.requestIdleCallback) {
              window.requestIdleCallback(scheduleTrace)
            } else {
              scheduleTrace()
            }
          })
        })
      )

      results.push(...batchResults)

      if (i + BATCH_SIZE < rawGlyphs.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    
    // Calculate median consonant height from traced glyphs
    updateMedianConsonantHeight(tracedGlyphs)
    
    // Second pass: re-trace with proper normalization if we have median height
    if (medianConsonantHeight && results.length > 0) {
      for (let i = 0; i < rawGlyphs.length; i += BATCH_SIZE) {
        const batch = rawGlyphs.slice(i, i + BATCH_SIZE)
        const batchStartIndex = i

        const batchResults = await Promise.all(
          batch.map(async (g, bi) => {
            if (!g._inkCanvas || g.status === "missing") {
              const { _inkCanvas, _inkW, _inkH, ...rest } = g
              return { ...rest, svgPath: null, viewBox: "0 0 100 100" }
            }

            const { _inkCanvas, _inkW, _inkH, ...rest } = g

            return new Promise(resolve => {
              const scheduleTrace = () => {
                setTimeout(() => {
                  try {
                    const traced = traceToSVGPath(g._inkCanvas, g._inkW, g._inkH, { ch: g.ch })
                    resolve({
                      ...rest,
                      svgPath: traced?.path || null,
                      viewBox: traced?.viewBox || "0 0 100 100",
                      glyphMetrics: traced?.glyphMetrics
                    })
                  } catch (error) {
                    console.error('Error re-tracing glyph:', error)
                    resolve({
                      ...rest,
                      svgPath: null,
                      viewBox: "0 0 100 100"
                    })
                  }
                }, 0)
              }

              if (window.requestIdleCallback) {
                window.requestIdleCallback(scheduleTrace)
              } else {
                scheduleTrace()
              }
            })
          })
        )

        // Update results with normalized versions
        for (let bi = 0; bi < batchResults.length; bi++) {
          results[batchStartIndex + bi] = batchResults[bi]
        }

        if (i + BATCH_SIZE < rawGlyphs.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    }

    return results
  } catch (error) {
    console.error('Error in traceAllGlyphs:', error)
    return rawGlyphs.map(g => ({
      ...g,
      svgPath: null,
      viewBox: "0 0 100 100"
    }))
  }
}

export { updateMedianConsonantHeight, calculateNormalizedViewBox, getMedianConsonantHeight }