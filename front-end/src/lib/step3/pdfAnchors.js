import { HGMETA_RE, HGCHAR_RE, TEMPLATE_CODE_RE, TEMPLATE_INDEX_RE } from "./constants.js"
import { decodeHgQrCharsPayload } from "./qr.js"

// Decode numeric character references like &#x0E48; or &#3656; back to real chars.
// Step 1 encodes Thai combining chars as NCR so pdfjs text extraction cannot drop them.
// pdfjs may return the NCR string as-is instead of decoding it.
function decodeNcr(str) {
  if (!str || !str.includes("&")) return str
  return str.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
}

export async function collectTextAnchors(page, viewport, maxIndex) {
  const textContent = await page.getTextContent()
  const items = textContent.items || []
  const rawAnchors = []

  // Collect per-cell character tags written by Step 1 as short hidden elements.
  // "HGCHAR:N=ก" — one element per cell.
  // BUT: pdfjs sometimes splits Thai combining chars (สระ/วรรณยุกต์ U+0E30–U+0E4E)
  // into TWO separate text items: e.g. "HGCHAR:1=" and "่" as separate items.
  // We peek at the next item when the char part is missing.
  // IMPORTANT: do NOT .trim() before matching HGCHAR — trim() can eat combining chars
  // that appear at string boundaries.
  const charByIndex = new Map()

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]
    // Use raw str for HGCHAR matching (trim only for non-HGCHAR checks below)
    const rawUntrimmed = String(item?.str || "")
    const raw = rawUntrimmed.trim()

    // Harvest HGCHAR tags first — try untrimmed first so combining chars survive
    const hgChar = rawUntrimmed.match(HGCHAR_RE) || raw.match(HGCHAR_RE)
    if (hgChar) {
      const idx = Number(hgChar[1])
      let ch = hgChar[2]
      // Trim surrounding whitespace from char part but preserve the char itself
      ch = ch.trim()
      // Decode numeric character references (e.g. &#x0E48; → "่") written by Step 1
      ch = decodeNcr(ch)
      // If char part is empty, pdfjs may have split the combining char to next item
      if (!ch && i + 1 < items.length) {
        const nextRaw = String(items[i + 1]?.str || "")
        // Accept if next item is a single Thai char — full Thai block U+0E00–U+0E7F
        if (/^[\u0E00-\u0E7F]$/.test(nextRaw)) {
          ch = nextRaw
          i += 1  // consume the peeked item
        }
      }
      if (ch && idx >= 1 && idx <= maxIndex) charByIndex.set(idx, ch)
      continue
    }

    if (!raw) continue

    const codeMatch = raw.match(TEMPLATE_CODE_RE)
    const indexMatch = raw.match(TEMPLATE_INDEX_RE)
    const prevRaw = String(items[i - 1]?.str || "").trim()
    const hasCodePrefix = /^HG$/i.test(prevRaw)
    let kind = null
    let index = 0

    if (codeMatch) {
      kind = "code"
      index = Number(codeMatch[1])
    } else if (indexMatch && hasCodePrefix) {
      kind = "code"
      index = Number(indexMatch[1])
    } else if (indexMatch) {
      kind = "index"
      index = Number(indexMatch[1])
    } else {
      continue
    }

    if (!Number.isFinite(index) || index < 1 || index > maxIndex) {
      continue
    }

    const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = item.transform || []
    const x = Number(e)
    const y = viewport.height - Number(f)
    const width = Number(item.width || Math.hypot(a, b) * raw.length || 0)
    const height = Number(item.height || Math.hypot(c, d) || 0)

    if (y < viewport.height * 0.14 || y > viewport.height * 0.97) continue
    if (height > viewport.height * 0.07) continue
    if (width > viewport.width * 0.16) continue

    rawAnchors.push({
      index,
      kind,
      x,
      y,
      width,
      height,
    })
  }

  const byIndex = new Map()
  for (const anchor of rawAnchors) {
    const prev = byIndex.get(anchor.index)
    if (!prev) {
      byIndex.set(anchor.index, anchor)
      continue
    }
    if (prev.kind !== "code" && anchor.kind === "code") {
      byIndex.set(anchor.index, anchor)
      continue
    }
    const prevDistance = Math.abs(prev.y - viewport.height * 0.55)
    const nextDistance = Math.abs(anchor.y - viewport.height * 0.55)
    if (nextDistance < prevDistance) {
      byIndex.set(anchor.index, anchor)
    }
  }

  const anchors = [...byIndex.values()].sort((a, b) => a.index - b.index)
  const codeAnchorCount = anchors.filter(a => a.kind === "code").length
  const allIndices = anchors.map(a => a.index)
  const startIndex = allIndices.length > 0 ? Math.min(...allIndices) : null
  let contiguousCount = 0
  if (startIndex != null) {
    while (byIndex.has(startIndex + contiguousCount)) {
      contiguousCount += 1
    }
  }

  let pageMeta = null
  for (const item of items) {
    const raw = String(item?.str || "")
    const m = raw.match(HGMETA_RE)
    if (m) {
      const cellCount = Number(m[5])
      const rawChars  = m[7] ? decodeHgQrCharsPayload(m[7]) : null
      pageMeta = {
        page:         Number(m[1]),
        totalPages:   Number(m[2]),
        cellFrom:     Number(m[3]),
        cellTo:       Number(m[4]),
        cellCount,
        totalGlyphs:  Number(m[6]),
        // Characters embedded directly in the invisible HGMETA text — reliable
        // fallback when the QR image cannot be decoded after print/scan.
        charsFromMeta: (Array.isArray(rawChars) && rawChars.length === cellCount)
          ? rawChars
          : null,
      }
      break
    }
  }

  return {
    anchors,
    byIndex,
    startIndex,
    contiguousCount,
    hasCodeAnchors: codeAnchorCount > 0,
    codeAnchorCount,
    pageMeta,
    charByIndex,   // Map<number, string> — populated from HGCHAR tags when available
  }
}