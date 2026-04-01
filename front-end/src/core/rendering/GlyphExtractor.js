import { GeometryService } from '../geometry/GeometryService.js'
import { GRID_COLS } from '../../lib/step3/constants.js'

export function extractGlyphsFromCanvas(params) {
  const { ctx, pageWidth, pageHeight, chars, calibration, cellRects } = params
  
  const useRegDots = cellRects && cellRects.length >= chars.length
  let geometry
  
  if (!useRegDots) {
    geometry = GeometryService.getGridGeometry(calibration)
  }

  return chars.map((ch, i) => {
    const row = Math.floor(i / GRID_COLS)
    const col = i % GRID_COLS
    let cellX, cellY, cellW, cellH
    
    if (useRegDots && cellRects[i]) {
      const rect = cellRects[i]
      const insetR = Math.round(Math.min(rect.w, rect.h) * GeometryService.GRID_GEOMETRY.insetRatio)
      cellX = Math.max(0, Math.round(rect.x) + insetR)
      cellY = Math.max(0, Math.round(rect.y) + insetR)
      cellW = Math.max(20, Math.round(rect.w) - insetR * 2)
      cellH = Math.max(20, Math.round(rect.h) - insetR * 2)
    } else {
      const cellPosition = GeometryService.calculateCellPosition(i, GRID_COLS, geometry)
      const cropRect = GeometryService.calculateCropRectangle(cellPosition)
      
      cellX = Math.max(0, Math.min(cropRect.x, pageWidth - 1))
      cellY = Math.max(0, Math.min(cropRect.y, pageHeight - 1))
      cellW = Math.max(20, Math.min(cropRect.width, pageWidth - cellX))
      cellH = Math.max(20, Math.min(cropRect.height, pageHeight - cellY))
    }
    
    const cropW = Math.min(cellW, pageWidth - cellX)
    const cropH = Math.min(cellH, pageHeight - cellY)

    const imageData = ctx.getImageData(cellX, cellY, cropW, cropH)
    const cropCanvas = document.createElement("canvas")
    cropCanvas.width = cropW
    cropCanvas.height = cropH
    const cropCtx = cropCanvas.getContext("2d")
    cropCtx?.putImageData(imageData, 0, 0)

    const inkOnlyData = buildInkOnlyImageData(imageData, cropW, cropH)
    const inkCanvas = document.createElement("canvas")
    inkCanvas.width = cropW
    inkCanvas.height = cropH
    const inkCtx = inkCanvas.getContext("2d")
    inkCtx?.putImageData(inkOnlyData, 0, 0)

    const { status, inkRatio, edgeRatio } = classifyGlyph(imageData, cropW, cropH)

    return {
      _inkCanvas: inkCanvas,
      _inkW: cropW,
      _inkH: cropH,
      id: `${i}-${ch}`,
      index: i + 1,
      ch,
      status,
      inkRatio,
      edgeRatio,
      preview: cropCanvas.toDataURL("image/png"),
      previewInk: inkCanvas.toDataURL("image/png"),
      svgPath: null,
      viewBox: "0 0 100 100",
    }
  })
}

// Helper function (moved from original file)
function buildInkOnlyImageData(imageData, width, height) {
  const cleaned = new ImageData(new Uint8ClampedArray(imageData.data), width, height)
  const { data } = cleaned

  const clear = i => {
    data[i] = data[i + 1] = data[i + 2] = 0
    data[i + 3] = 0
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 30) continue

    const lum = r * 0.2126 + g * 0.7152 + b * 0.0722

    const blueDom = b - Math.max(r, g)
    const isBlueFamily = blueDom > 5 && b > 100
    if (isBlueFamily) {
      clear(i)
      continue
    }

    if (lum > 180) {
      clear(i)
      continue
    }

    data[i] = data[i + 1] = data[i + 2] = 0
    data[i + 3] = 255
  }

  return cleaned
}

function classifyGlyph(imageData, width, height) {
  const { data } = imageData
  let darkPixels = 0
  let borderDarkPixels = 0
  const border = Math.max(2, Math.floor(Math.min(width, height) * 0.12))

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4
      const alpha = data[idx + 3]
      if (alpha < 12) continue

      const lum = data[idx] * 0.2126 + data[idx + 1] * 0.7152 + data[idx + 2] * 0.0722
      if (lum < 235) {
        darkPixels++
        if (x < border || x >= width - border || y < border || y >= height - border) {
          borderDarkPixels++
        }
      }
    }
  }

  const total = width * height
  const inkRatio = total > 0 ? darkPixels / total : 0
  const edgeRatio = darkPixels > 0 ? borderDarkPixels / darkPixels : 0

  if (inkRatio < 0.008) {
    return { status: "missing", inkRatio, edgeRatio }
  }

  if (edgeRatio > 0.32) {
    return { status: "overflow", inkRatio, edgeRatio }
  }

  return { status: "ok", inkRatio, edgeRatio }
}
