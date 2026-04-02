// documentHtml.js — build the HTML fragment rendered as handwritten text.
//
// Thai grapheme clusters are stored as multiple individual glyphs in the
// template (one glyph per code point). The token layer (tokens.js) already
// decomposed each cluster into subGlyphs[]. This file renders them overlaid
// inside a single slot using absolute positioning so the result looks like
// one handwritten character rather than separate parts spread across the page.

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
  try { return `data:image/png;base64,${btoa(atob(parts[1]))}` }
  catch { return "" }
}

function penStrokeWidth(fontSize, mul = 1) {
  const fs = Number(fontSize) || 32
  return Math.max(1.2, Math.min(3.5, fs * 0.064 * mul))
}

function glyphMetrics(fontSize, slotWRatio, slotHRatio, spaceWRatio) {
  const fs = Number(fontSize) || 32
  return {
    slotW:  Math.max(12, Math.round(fs * slotWRatio)),
    slotH:  Math.max(20, Math.round(fs * slotHRatio)),
    spaceW: Math.max(3,  Math.round(fs * spaceWRatio)),
  }
}

// ─── Render one glyph image (SVG path or PNG) into a given size ──────────────
// Returns an HTML string for the inner content.
// Used for both single-glyph slots and each layer in a Thai cluster slot.

function renderGlyphInner(g, preview, ch, textColor, fontSize, strokeWMul) {
  const hasSvg =
    g &&
    typeof g.svgPath === "string" &&
    g.svgPath.trim() !== "" &&
    g.svgPath.trim() !== "M 0 0"

  const pngUse = preview || (g ? normalizePngDataUrl(g.previewInk || "") : "")
  const sw     = penStrokeWidth(fontSize, strokeWMul ?? 1).toFixed(2)

  if (hasSvg) {
    const vb = g.viewBox || "0 0 100 100"
    return (
      `<svg viewBox="${vb}" style="width:100%;height:100%;display:block;` +
      `shape-rendering:geometricPrecision;overflow:visible" aria-label="${escapeHtml(ch)}">` +
      `<path d="${escapeHtml(g.svgPath)}" fill="none" stroke="${textColor}" ` +
      `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ` +
      `paint-order="stroke fill"/></svg>`
    )
  }
  if (pngUse) {
    return (
      `<img src="${pngUse}" alt="${escapeHtml(ch)}" ` +
      `style="width:100%;height:100%;object-fit:contain;object-position:left bottom;` +
      `display:block;mix-blend-mode:multiply" />`
    )
  }
  // Fallback: render the Unicode character itself in a Thai-friendly font.
  return `<span style="font-family:'TH Sarabun New','Noto Sans Thai',Tahoma,sans-serif;font-size:inherit;line-height:1">${escapeHtml(ch)}</span>`
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
        `<span style="display:inline-block;width:${spaceW}px;height:${slotH}px;` +
        `vertical-align:bottom;flex-shrink:0"></span>`
      )
      continue
    }
    if (token.type !== "word") continue

    const t0 = token.chars[0]?.variant
    if (!t0) continue
    const rotate = t0.rotate.toFixed(2)
    const skewX  = t0.skewX.toFixed(2)
    const topPx  = (t0.shiftYWord ?? t0.shiftY ?? 0).toFixed(2)

    const charPieces = token.chars.map((ct, ci) => {
      const v  = ct.variant
      const hl = hlColor ? `background:${hlColor};` : ""
      const op = (v.opacity ?? 1).toFixed(3)
      const tx = (v.shiftX ?? 0).toFixed(2)
      const ty = (v.shiftYMicro ?? 0).toFixed(2)
      const mr = (v.microRotate ?? 0).toFixed(2)

      // Thai grapheme clusters can occupy more horizontal space than a single
      // consonant. clusterWidth is a multiplier computed by tokens.js:
      //   "ก" → 1.0,  "กา" → 1.7,  "เก้า" → 1.7,  "A" → 1.0
      const cw        = ct.clusterWidth ?? 1.0
      const charSlotW = Math.round(slotW * cw)

      const overlapPx    = Math.min(Math.max(0, Math.round(charSlotW * overlapFactor)), Math.max(0, charSlotW - 1))
      const marginLeftPx = ci === 0 ? 0 : -overlapPx

      // ── Render subGlyphs (Thai cluster) or single glyph (Latin) ──────────
      //
      // subGlyphs[] contains one entry per component code point of the cluster.
      // For "เก้า": [เ, ก, ้, า] — each with its own glyph from the template.
      // We render them all inside one slot using position:absolute so they
      // overlap exactly the way Thai characters should on the page.
      //
      // Each sub-layer fills the slot 100%×100% and uses object-fit:contain
      // so SVG/PNG glyphs scale correctly. The layers are transparent (PNG
      // mix-blend-mode:multiply, SVG stroke only) so they compose cleanly.

      const subGlyphs = ct.subGlyphs
      let innerContent

      if (subGlyphs && subGlyphs.length > 1) {
        // ── Thai cluster: stack all component glyphs ──────────────────────
        const layers = subGlyphs.map(sg => {
          const inner = renderGlyphInner(
            sg.glyph, sg.preview, sg.ch, textColor, fontSize, v.strokeWMul
          )
          return (
            `<span style="position:absolute;inset:0;display:flex;align-items:flex-end;` +
            `justify-content:flex-start;overflow:visible">` +
            `${inner}</span>`
          )
        }).join("")

        innerContent =
          `<span style="position:relative;display:block;width:100%;height:100%;overflow:visible">` +
          `${layers}</span>`
      } else {
        // ── Single glyph (Latin char or single Thai char) ─────────────────
        const sg    = subGlyphs?.[0]
        const g     = sg?.glyph ?? ct.glyph
        const prev  = sg?.preview ?? ct.preview ?? ""
        const ch    = sg?.ch ?? ct.ch
        innerContent = renderGlyphInner(g, prev, ch, textColor, fontSize, v.strokeWMul)
      }

      return (
        `<span style="display:inline-block;` +
        `transform:translate(${tx}px,${ty}px) rotate(${mr}deg);` +
        `transform-origin:center bottom;vertical-align:bottom;` +
        `margin-right:-${overlapPx}px;margin-left:${marginLeftPx}px">` +
        `<span style="display:inline-block;width:${charSlotW}px;height:${slotH}px;` +
        `vertical-align:bottom;flex-shrink:0;margin-right:0;${hl}">` +
        `<span style="display:inline-flex;align-items:flex-end;justify-content:flex-start;` +
        `width:100%;height:100%;opacity:${op};color:${textColor};overflow:visible">` +
        `${innerContent}</span></span></span>`
      )
    })

    pieces.push(
      `<span class="hw-word" style="display:inline-block;vertical-align:bottom;` +
      `margin-top:${topPx}px;overflow:visible;` +
      `transform:rotate(${rotate}deg) skewX(${skewX}deg);` +
      `transform-origin:left bottom;box-sizing:border-box;` +
      `page-break-inside:avoid;break-inside:avoid">` +
      charPieces.join("") +
      `</span>`
    )
  }

  return pieces.join("")
}