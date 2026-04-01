/**
 * WEB WORKER FOR SVG TRACING
 * 
 * Moves intensive pixel scanning off main thread to prevent UI freezing
 */

// SVG tracing logic moved to worker
function traceToSVGPath(imageData, width, height) {
  try {
    const { data } = imageData
    const threshold = 180
    const mask = new Uint8Array(width * height)
    
    // Optimized scanning with early exit
    let inkCount = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx],
          g = data[idx + 1],
          b = data[idx + 2],
          a = data[idx + 3]
        if (a < 50) {
          mask[y * width + x] = 0
          continue
        }
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722
        const isInk = lum < threshold ? 1 : 0
        mask[y * width + x] = isInk
        inkCount += isInk
      }
      // Early exit if too little ink
      if (inkCount > 0 && y < height / 4 && inkCount < 10) {
        return null
      }
    }
    
    if (inkCount < 10) return null

    const scaleX = 100 / width
    const scaleY = 100 / height

    const pathCmds = []
    const STEP = Math.max(1, Math.floor(Math.min(width, height) / 80))

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
      if (inRun) runs.push({ start: runStart, end: width - 1 })

      for (const run of runs) {
        const midX = (((run.start + run.end) / 2) * scaleX).toFixed(1)
        const midY = (y * scaleY).toFixed(1)

        const matched = prevRuns.find(
          pr => pr.start <= run.end + STEP * 2 && pr.end >= run.start - STEP * 2
        )

        if (matched) {
          const prevMidX = (((matched.start + matched.end) / 2) * scaleX).toFixed(1)
          const prevMidY = ((y - STEP) * scaleY).toFixed(1)
          pathCmds.push(`M ${prevMidX} ${prevMidY} L ${midX} ${midY}`)
        } else {
          const x1 = (run.start * scaleX).toFixed(1)
          const x2 = (run.end * scaleX).toFixed(1)
          pathCmds.push(`M ${x1} ${midY} L ${x2} ${midY}`)
        }
      }

      prevRuns = runs
    }

    if (pathCmds.length === 0) return null

    return {
      path: pathCmds.join(" "),
      viewBox: "0 0 100 100",
    }
  } catch (error) {
    return null
  }
}

// Worker message handler
self.onmessage = function(e) {
  const { type, payload } = e.data
  
  switch (type) {
    case 'TRACE_GLYPH':
      try {
        const { imageData, width, height, glyphId } = payload
        const result = traceToSVGPath(imageData, width, height)
        
        self.postMessage({
          type: 'TRACE_COMPLETE',
          payload: {
            glyphId,
            result: result || { path: null, viewBox: "0 0 100 100" }
          }
        })
      } catch (error) {
        self.postMessage({
          type: 'TRACE_ERROR',
          payload: {
            glyphId,
            error: error.message
          }
        })
      }
      break
      
    case 'TRACE_BATCH':
      try {
        const { glyphs } = payload
        const results = []
        
        for (const glyph of glyphs) {
          const result = traceToSVGPath(glyph.imageData, glyph.width, glyph.height)
          results.push({
            glyphId: glyph.id,
            result: result || { path: null, viewBox: "0 0 100 100" }
          })
        }
        
        self.postMessage({
          type: 'BATCH_COMPLETE',
          payload: { results }
        })
      } catch (error) {
        self.postMessage({
          type: 'BATCH_ERROR',
          payload: { error: error.message }
        })
      }
      break
      
    default:
      console.warn('Unknown worker message type:', type)
  }
}

// Worker ready signal
self.postMessage({ type: 'WORKER_READY' })
