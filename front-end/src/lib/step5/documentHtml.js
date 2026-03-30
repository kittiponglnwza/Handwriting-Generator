function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function normalizePngDataUrl(dataUrl) {
  if (!dataUrl?.startsWith("data:image/png")) return ""
  const parts = String(dataUrl).split(",")
  if (parts.length < 2) return ""
  try {
    return `data:image/png;base64,${btoa(atob(parts[1]))}`
  } catch {
    return ""
  }
}

function penStrokeWidth(fontSize, mul = 1) {
  const fs = Number(fontSize) || 32
  return Math.max(1.2, Math.min(3.5, fs * 0.064 * mul))
}

function glyphMetrics(fontSize, slotWRatio, slotHRatio, spaceWRatio) {
  const fs = Number(fontSize) || 32
  return {
    slotW: Math.max(12, Math.round(fs * slotWRatio)),
    slotH: Math.max(20, Math.round(fs * slotHRatio)),
    spaceW: Math.max(3, Math.round(fs * spaceWRatio)),
  }
}

export function buildDocumentHtmlFragment({
  tokens,
  fontSize,
  textColor,
  hlColor,
  slotWRatio,
  slotHRatio,
  spaceWRatio,
  overlapFactor,
}) {
  const pieces = []
  const { slotW, slotH, spaceW } = glyphMetrics(fontSize, slotWRatio, slotHRatio, spaceWRatio)

  for (const token of tokens) {
    if (token.type === "newline") {
      pieces.push('<span class="hw-br"></span>')
      continue
    }
    if (token.type === "space") {
      pieces.push(
        `<span style="display:inline-block;width:${spaceW}px;height:${slotH}px;vertical-align:bottom;flex-shrink:0"></span>`
      )
      continue
    }
    if (token.type !== "word") continue

    const t0 = token.chars[0]?.variant
    if (!t0) continue
    const rotate = t0.rotate.toFixed(2)
    const skewX = t0.skewX.toFixed(2)
    const topPx = (t0.shiftYWord ?? t0.shiftY ?? 0).toFixed(2)

    const charPieces = token.chars.map((ct, ci) => {
      const v = ct.variant
      const hl = hlColor ? `background:${hlColor};` : ""
      const g = ct.glyph
      const hasSvg =
        g &&
        typeof g.svgPath === "string" &&
        g.svgPath.trim() !== "" &&
        g.svgPath.trim() !== "M 0 0"

      const pngInk = g ? normalizePngDataUrl(g.previewInk || "") : ""
      const pngUse = pngInk
      const sw = penStrokeWidth(fontSize, v.strokeWMul ?? 1).toFixed(2)
      const op = (v.opacity ?? 1).toFixed(3)
      const tx = (v.shiftX ?? 0).toFixed(2)
      const ty = (v.shiftYMicro ?? 0).toFixed(2)
      const mr = (v.microRotate ?? 0).toFixed(2)

      let inner
      if (hasSvg) {
        const vb = g.viewBox || "0 0 100 100"
        inner =
          `<svg viewBox="${vb}" style="width:100%;height:100%;display:block;shape-rendering:geometricPrecision;overflow:visible" aria-label="${escapeHtml(ct.ch)}">` +
          `<path d="${escapeHtml(g.svgPath)}" fill="none" stroke="${textColor}" ` +
          `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke fill"/></svg>`
      } else if (pngUse) {
        inner =
          `<img src="${pngUse}" alt="${escapeHtml(ct.ch)}" ` +
          `style="width:100%;height:100%;object-fit:contain;object-position:left bottom;display:block;mix-blend-mode:multiply" />`
      } else {
        inner = escapeHtml(ct.ch)
      }

      const overlapPx = Math.min(Math.max(0, Math.round(slotW * overlapFactor)), Math.max(0, slotW - 1))
      const marginLeftPx = ci === 0 ? 0 : -overlapPx

      return (
        `<span style="display:inline-block;transform:translate(${tx}px,${ty}px) rotate(${mr}deg);` +
          `transform-origin:center bottom;vertical-align:bottom;margin-right:-${overlapPx}px;margin-left:${marginLeftPx}px">` +
          `<span style="display:inline-block;width:${slotW}px;height:${slotH}px;` +
          `vertical-align:bottom;flex-shrink:0;margin-right:0;${hl}">` +
          `<span style="display:inline-flex;align-items:flex-end;justify-content:flex-start;` +
          `width:100%;height:100%;opacity:${op};color:${textColor};overflow:visible">` +
          `${inner}</span></span></span>`
      )
    })

    pieces.push(
      `<span class="hw-word" style="display:inline-block;vertical-align:bottom;` +
        `margin-top:${topPx}px;overflow:visible;` +
        `transform:rotate(${rotate}deg) skewX(${skewX}deg);transform-origin:left bottom;box-sizing:border-box;` +
        `page-break-inside:avoid;break-inside:avoid">` +
        charPieces.join("") +
        `</span>`
    )
  }

  return pieces.join("")
}

