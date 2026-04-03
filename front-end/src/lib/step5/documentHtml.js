// documentHtml.js — build the HTML fragment rendered as handwritten text.
//
// Thai grapheme clusters use anchor positioning for natural rendering.
// Each component (consonant, vowels, tone marks) is positioned at specific
// anchor points relative to the base consonant, mimicking real Thai handwriting.

import { calculateAnchorPositions } from "./thaiAnchors.js"

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
      // consonant. clusterWidth is computed by calculateClusterWidth() in thaiAnchors.js:
      //   "ก"  → 1.0  (single consonant)
      //   "กั" → 1.0  (consonant + upper vowel — stacks vertically, no extra width)
      //   "กา" → 1.4  (consonant + trailing vowel — adds horizontal space)
      //   "เก" → 1.3  (leading vowel + consonant — adds horizontal space)
      const cw        = ct.clusterWidth ?? 1.0
      const charSlotW = Math.round(slotW * cw)

      const overlapPx    = Math.min(Math.max(0, Math.round(charSlotW * overlapFactor)), Math.max(0, charSlotW - 1))
      const marginLeftPx = ci === 0 ? 0 : -overlapPx

      // ── Render subGlyphs (Thai cluster) or single glyph (Latin) ──────────
      //
      // For Thai clusters, use anchor positioning to place each component
      // at the correct position relative to the base consonant, creating
      // natural Thai handwriting appearance.

      const subGlyphs = ct.subGlyphs
      let innerContent

      if (subGlyphs && subGlyphs.length > 1) {
        // ── Thai cluster: stack all components in the same slot ──────────────
        // Each layer is position:absolute; left:0; bottom:0 filling the slot,
        // then nudged by offsetX/offsetY for TOP/BOTTOM/LEFT/RIGHT anchors.
        const cluster   = { subGlyphs }
        const positions = calculateAnchorPositions(cluster, fontSize)

        const layers = positions.map(pos => {
          const layerW = Math.round(charSlotW * pos.scale)
          const layerH = Math.round(slotH     * pos.scale)
          const inner  = renderGlyphInner(
            pos.component.glyph, pos.component.preview, pos.component.ch,
            textColor, fontSize * pos.scale, v.strokeWMul
          )
          return (
            `<span style="position:absolute;left:0;bottom:0;` +
            `width:${layerW}px;height:${layerH}px;` +
            `transform:translate(${pos.offsetX.toFixed(2)}px,${pos.offsetY.toFixed(2)}px);` +
            `display:flex;align-items:flex-end;justify-content:flex-start;overflow:visible">` +
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