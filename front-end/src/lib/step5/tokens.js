import { calculateClusterWidth } from "./thaiAnchors.js"
// ---------------------------------------------------------------------------
// Thai script: a single "character" perceived by a reader is a grapheme
// cluster of multiple Unicode code points rendered at the SAME horizontal
// position. The template (Step 1) stores each code point in its own cell,
// so glyphMap has keys like "ก", "้", "า", "เ" — never whole syllables.
//
// The rendering pipeline must therefore:
//   1. Segment input text into grapheme clusters  ("เก้า" → one unit)
//   2. For each cluster, look up EACH component code point separately
//   3. Render all component glyphs overlaid in ONE slot
//
// This file handles steps 1 & 2. documentHtml.js handles step 3.

// ─── Thai Unicode category helpers ──────────────────────────────────────────

function isThaiConsonant(cp)    { return cp >= 0x0e01 && cp <= 0x0e2e }
function isThaiLeadingVowel(cp) { return cp >= 0x0e40 && cp <= 0x0e44 }
function isThaiCombining(cp) {
  return (
    cp === 0x0e31 ||
    (cp >= 0x0e34 && cp <= 0x0e3a) ||
    (cp >= 0x0e47 && cp <= 0x0e4e)
  )
}
function isThai(cp) { return cp >= 0x0e00 && cp <= 0x0e7f }
function isThaiTrailingVowel(cp) {
  return (
    isThai(cp) &&
    !isThaiConsonant(cp) &&
    !isThaiLeadingVowel(cp) &&
    !isThaiCombining(cp) &&
    cp !== 0x0e00
  )
}

// ─── Unicode Grapheme Cluster Segmentation ───────────────────────────────────
// Use Intl.Segmenter for proper Unicode grapheme cluster segmentation
// This handles Thai, emoji, accented Latin, and all complex scripts correctly

function segmentUnicodeGraphemes(text) {
  if (!text) return []
  
  // Use Intl.Segmenter with Thai locale for optimal Thai handling
  const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
  return [...segmenter.segment(text)].map(segment => segment.segment)
}

// ─── Cluster component decomposition ────────────────────────────────────────
// Split a grapheme cluster back into its individual glyph lookup keys.
// These are the keys present in glyphMap (one per template cell from Step 1).
//
// Ordering: leading vowel → consonant → combining marks → trailing vowel
// This is the order they appear visually and the order Step 1 renders them.
//
// For non-Thai clusters (Latin, digits) the cluster IS the key (length 1).

function clusterComponents(cluster) {
  if (!cluster) return []
  const chars = [...cluster]
  if (chars.length === 1) return chars  // common case: single code point

  // Check if this is a Thai cluster
  const hasThai = chars.some(ch => isThai(ch.codePointAt(0)))
  if (!hasThai) return chars  // non-Thai multi-cp (emoji, etc.): keep as-is

  // Decompose into lookup keys preserving display order:
  // leading vowels first, then consonant, then combining, then trailing
  const leading   = chars.filter(ch => isThaiLeadingVowel(ch.codePointAt(0)))
  const consonant = chars.filter(ch => isThaiConsonant(ch.codePointAt(0)))
  const combining = chars.filter(ch => isThaiCombining(ch.codePointAt(0)))
  const trailing  = chars.filter(ch => {
    const cp = ch.codePointAt(0)
    return isThai(cp) && !isThaiLeadingVowel(cp) && !isThaiConsonant(cp) && !isThaiCombining(cp) && cp !== 0x0e00
  })
  return [...leading, ...consonant, ...combining, ...trailing]
}

// ─── Cluster slot width ──────────────────────────────────────────────────────
// How many base slotW units this cluster needs horizontally.
// Combining marks / leading vowels share the consonant's horizontal space,
// only trailing vowels (า ะ …) add width.

function clusterVisualWidth(cluster) {
  if (!cluster) return 1.0
  let width = 0
  for (const ch of [...cluster]) {
    const cp = ch.codePointAt(0)
    if (isThaiLeadingVowel(cp))  { width += 0.0; continue }
    if (isThaiCombining(cp))     { width += 0.0; continue }
    if (isThaiConsonant(cp))     { width += 1.0; continue }
    if (isThaiTrailingVowel(cp)) { width += 0.7; continue }
    if (isThai(cp))              { width += 0.6; continue }
    width += 1.0
  }
  return Math.max(1.0, width)
}

// ─── RNG / style helpers (unchanged) ────────────────────────────────────────

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

function createRng(seedStr) {
  let t = (hashString(seedStr) || 1) >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(min, max, t) { return min + (max - min) * t }

function buildWordStyle(wordRng, weight = "normal") {
  return {
    rotate:  lerp(-1.0, 1.0,  wordRng()),
    skewX:   lerp(-1.0, 1.0,  wordRng()),
    scaleY:  lerp(0.98, 1.02, wordRng()),
    shiftY:  lerp(-1.0, 1.0,  wordRng()),
    opacity:
      weight === "bold"  ? lerp(0.92, 1.0,  wordRng())
      : weight === "light" ? lerp(0.6,  0.76, wordRng())
      : lerp(0.88, 1.0, wordRng()),
  }
}

function buildCharVariant(charRng, wordStyle, weight = "normal") {
  const widthScale = weight === "bold" ? 0.6 : weight === "light" ? 0.52 : 0.56
  return {
    rotate:      wordStyle.rotate,
    skewX:       wordStyle.skewX,
    shiftYWord:  wordStyle.shiftY,
    scaleX:      1.0,
    scaleY:      wordStyle.scaleY,
    shiftX:      lerp(-1.35, 1.35, charRng()),
    shiftYMicro: lerp(-1.1,  1.1,  charRng()),
    microRotate: lerp(-0.55, 0.55, charRng()),
    opacity:     wordStyle.opacity * lerp(0.93, 1, charRng()),
    strokeWMul:  lerp(0.88,  1.06, charRng()),
    widthScale,
    kerning: 0,
  }
}

function normalizePngDataUrl(dataUrl) {
  if (!dataUrl?.startsWith("data:image/png")) return ""
  const parts = String(dataUrl).split(",")
  if (parts.length < 2) return ""
  try { return `data:image/png;base64,${btoa(atob(parts[1]))}` }
  catch { return "" }
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export function buildTokens({
  text,
  glyphMap,
  documentSeed,
  dnaNonce,
  editNonce,
  fontWeight,
}) {
  const list       = []
  const rawSegments = (text || "").split(/( |\n)/)
  let globalIdx    = 0

  for (const seg of rawSegments) {
    if (seg === "\n") {
      list.push({ type: "newline", id: `n-${globalIdx++}` })
      continue
    }
    if (seg === " " || seg === "") {
      if (seg === " ") list.push({ type: "space", id: `s-${globalIdx++}` })
      continue
    }

    const wordSeed  = `${documentSeed}-${dnaNonce}-w${globalIdx}-${seg}`
    const wordRng   = createRng(wordSeed)
    const wordStyle = buildWordStyle(wordRng, fontWeight)

    // Segment the word into proper Unicode grapheme clusters.
    // "สวัสดีครับ" → ["ส", "วั", "ส", "ดี", "ค", "รั", "บ"]
    // "Hello" → ["H","e","l","l","o"]
    const clusters   = segmentUnicodeGraphemes(seg)
    const charTokens = []

    for (let ci = 0; ci < clusters.length; ci++) {
      const cluster  = clusters[ci]
      const charRng  = createRng(`${wordSeed}-c${ci}`)
      const variant  = buildCharVariant(charRng, wordStyle, fontWeight)

      // Decompose cluster into individual codepoint keys matching glyphMap entries.
      // clusterComponents() returns visual order: leading vowel → consonant → combining → trailing.
      // For single codepoints (Latin, digits) this is just [cluster].
      const components = clusterComponents(cluster)

      // Build subGlyphs: one entry per component codepoint, each with its own picked glyph.
      // documentHtml.js and Step5.jsx check ct.subGlyphs?.length > 1 to decide whether to
      // do anchor-based multi-layer rendering vs single-glyph slot rendering.
      const subGlyphs = components.map((ch, ki) => {
        const candidates = glyphMap.get(ch) || []
        let glyph   = null
        let preview = ""
        if (candidates.length > 0) {
          const pickRng = createRng(`${wordSeed}-c${ci}-k${ki}-e${editNonce}`)
          const pickIdx = Math.floor(pickRng() * candidates.length)
          glyph   = candidates[pickIdx]
          preview = glyph ? normalizePngDataUrl(glyph.previewInk || glyph.preview || "") : ""
        }
        return { ch, glyph, preview }
      })

      // Primary glyph = consonant component (used for single-slot fallback & pickedVersion).
      // Prefer consonant; fall back to first component found.
      const primarySub     = subGlyphs.find(sg => isThaiConsonant(sg.ch.codePointAt(0))) ?? subGlyphs[0]
      const primaryGlyph   = primarySub?.glyph   ?? null
      const primaryPreview = primarySub?.preview  ?? ""

      // Cluster visual width — uses calculateClusterWidth() from thaiAnchors:
      //   - TOP/BOTTOM anchors (tone marks, upper/lower vowels) stack → 0 extra width
      //   - LEFT anchor (leading vowel เ แ โ ใ ไ) adds +0.3
      //   - RIGHT anchor (trailing vowel า ะ …) adds +0.4
      // Single codepoint clusters return 1.0.
      const clusterWidth = calculateClusterWidth(cluster)

      charTokens.push({
        type:          "char",
        id:            `c-${globalIdx}-${ci}`,
        ch:            cluster,
        variant,
        glyph:         primaryGlyph,
        preview:       primaryPreview,
        pickedVersion: primaryGlyph?.version ?? null,
        clusterWidth,
        // subGlyphs present only for multi-codepoint clusters → triggers layered rendering.
        subGlyphs:     subGlyphs.length > 1 ? subGlyphs : undefined,
      })
    }

    list.push({ type: "word", id: `word-${globalIdx}`, chars: charTokens })
    globalIdx += seg.length
  }

  return list
}