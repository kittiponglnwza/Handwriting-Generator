/**
 * WEB WORKER FOR SVG TRACING
 *
 * Converts ink pixel mask → filled outline SVG path suitable for TTF embedding.
 *
 * WHY THE OLD CODE CAUSED SOLID BLACK GLYPHS:
 *   Old algorithm output bare "M x0 y0 L x1 y1" open polylines (centerlines).
 *   TTF outlines are ALWAYS filled — an unclosed path fills unpredictably,
 *   usually producing a solid black blob.
 *
 * FIX: build CLOSED outline trapezoids (Z-terminated) so the fill area is
 * only the thin stroke outline, not the entire glyph bounding box.
 */

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }

function traceToSVGPath(imageData, width, height) {
  try {
    const { data } = imageData
    const THRESHOLD = 180
    const mask = new Uint8Array(width * height)

    // 1. Build ink mask
    let inkCount = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        if (data[i + 3] < 50) continue
        const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722
        if (lum < THRESHOLD) { mask[y * width + x] = 1; inkCount++ }
      }
    }
    if (inkCount < 10) return null

    // 2. Scale: pixel → 0-100 SVG space
    const sx = 100 / width
    const sy = 100 / height
    const STEP = Math.max(1, Math.floor(Math.min(width, height) / 80))

    // 3. Extract runs per sampled row
    const rowRuns = []
    for (let y = 0; y < height; y += STEP) {
      const runs = []
      let inRun = false, runStart = 0
      for (let x = 0; x < width; x++) {
        const ink = mask[y * width + x] === 1
        if (ink && !inRun)  { inRun = true;  runStart = x }
        if (!ink && inRun)  { inRun = false; runs.push({ start: runStart, end: x - 1 }) }
      }
      if (inRun) runs.push({ start: runStart, end: width - 1 })
      for (const r of runs) {
        r.midX  = (r.start + r.end) / 2 * sx
        r.midY  = y * sy
        r.halfW = clamp((r.end - r.start) / 2 * sx, 0.8, 12)
      }
      rowRuns.push({ y, runs })
    }

    // 4. Build CLOSED outline sub-paths (trapezoids / rects)
    const parts = []
    const halfStep = STEP * sy * 0.5

    function emitRect(r) {
      const x0 = (r.midX - r.halfW).toFixed(2)
      const x1 = (r.midX + r.halfW).toFixed(2)
      const yt  = Math.max(0,   r.midY - halfStep).toFixed(2)
      const yb  = Math.min(100, r.midY + halfStep).toFixed(2)
      // Closed rectangle — Z ensures fill is bounded
      parts.push(`M ${x0} ${yt} L ${x1} ${yt} L ${x1} ${yb} L ${x0} ${yb} Z`)
    }

    function emitTrap(top, bot) {
      const tx0 = (top.midX - top.halfW).toFixed(2)
      const tx1 = (top.midX + top.halfW).toFixed(2)
      const bx0 = (bot.midX - bot.halfW).toFixed(2)
      const bx1 = (bot.midX + bot.halfW).toFixed(2)
      // Closed trapezoid connecting two adjacent runs — Z bounds the fill
      parts.push(`M ${tx0} ${top.midY.toFixed(2)} L ${tx1} ${top.midY.toFixed(2)} L ${bx1} ${bot.midY.toFixed(2)} L ${bx0} ${bot.midY.toFixed(2)} Z`)
    }

    for (let ri = 0; ri < rowRuns.length; ri++) {
      const prevRuns = ri > 0 ? rowRuns[ri - 1].runs : []
      for (const run of rowRuns[ri].runs) {
        const matched = prevRuns.find(
          pr => pr.start <= run.end + STEP * 2 && pr.end >= run.start - STEP * 2
        )
        if (matched) emitTrap(matched, run)
        else         emitRect(run)
      }
    }

    if (parts.length === 0) return null
    return { path: parts.join(' '), viewBox: '0 0 100 100' }
  } catch (_) {
    return null
  }
}

self.onmessage = function(e) {
  const { type, payload } = e.data
  switch (type) {
    case 'TRACE_GLYPH': {
      try {
        const { imageData, width, height, glyphId } = payload
        const result = traceToSVGPath(imageData, width, height)
        self.postMessage({
          type: 'TRACE_COMPLETE',
          payload: { glyphId, result: result || { path: null, viewBox: '0 0 100 100' } },
        })
      } catch (error) {
        self.postMessage({ type: 'TRACE_ERROR', payload: { glyphId: payload?.glyphId, error: error.message } })
      }
      break
    }
    case 'TRACE_BATCH': {
      try {
        const { glyphs } = payload
        const results = []
        for (const glyph of glyphs) {
          const result = traceToSVGPath(glyph.imageData, glyph.width, glyph.height)
          results.push({ glyphId: glyph.id, result: result || { path: null, viewBox: '0 0 100 100' } })
        }
        self.postMessage({ type: 'BATCH_COMPLETE', payload: { results } })
      } catch (error) {
        self.postMessage({ type: 'BATCH_ERROR', payload: { error: error.message } })
      }
      break
    }
    default:
      console.warn('Unknown worker message type:', type)
  }
}

self.postMessage({ type: 'WORKER_READY' })