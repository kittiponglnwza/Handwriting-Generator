export function traceToSVGPath(inkCanvas, width, height) {
  try {
    const ctx2 = inkCanvas.getContext("2d")
    if (!ctx2) return null

    const imageData = ctx2.getImageData(0, 0, width, height)
    const { data } = imageData

    const threshold = 180
    const mask = new Uint8Array(width * height)

    let inkCount = 0
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
      }
    }

    // [FIX #2] ลบ early-exit ที่ผิดออก เช็คทีเดียวหลังสแกนครบ
    if (inkCount < 10) return null

    const scaleX = 100 / width
    const scaleY = 100 / height

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
    console.error('Error in traceToSVGPath:', error)
    return null
  }
}

export async function traceAllGlyphs(rawGlyphs) {
  const BATCH_SIZE = 8
  const results = []

  try {
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
                  const traced = traceToSVGPath(g._inkCanvas, g._inkW, g._inkH)
                  resolve({
                    ...rest,
                    svgPath: traced?.path || null,
                    viewBox: traced?.viewBox || "0 0 100 100"
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
  } catch (error) {
    console.error('Error in traceAllGlyphs:', error)
    return rawGlyphs.map(g => ({
      ...g,
      svgPath: null,
      viewBox: "0 0 100 100"
    }))
  }

  return results
}