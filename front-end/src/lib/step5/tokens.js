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

function lerp(min, max, t) {
  return min + (max - min) * t
}

function buildWordStyle(wordRng, weight = "normal") {
  return {
    rotate: lerp(-1.0, 1.0, wordRng()),
    skewX: lerp(-1.0, 1.0, wordRng()),
    scaleY: lerp(0.98, 1.02, wordRng()),
    shiftY: lerp(-1.0, 1.0, wordRng()),
    opacity:
      weight === "bold" ? lerp(0.92, 1.0, wordRng())
      : weight === "light" ? lerp(0.6, 0.76, wordRng())
      : lerp(0.88, 1.0, wordRng()),
  }
}

function buildCharVariant(charRng, wordStyle, weight = "normal") {
  const widthScale = weight === "bold" ? 0.6 : weight === "light" ? 0.52 : 0.56
  return {
    rotate: wordStyle.rotate,
    skewX: wordStyle.skewX,
    shiftYWord: wordStyle.shiftY,
    scaleX: 1.0,
    scaleY: wordStyle.scaleY,
    shiftX: lerp(-1.35, 1.35, charRng()),
    shiftYMicro: lerp(-1.1, 1.1, charRng()),
    microRotate: lerp(-0.55, 0.55, charRng()),
    opacity: wordStyle.opacity * lerp(0.93, 1, charRng()),
    strokeWMul: lerp(0.88, 1.06, charRng()),
    widthScale,
    kerning: 0,
  }
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

export function buildTokens({
  text,
  glyphMap,
  documentSeed,
  dnaNonce,
  editNonce,
  fontWeight,
}) {
  const list = []
  const segments = (text || "").split(/( |\n)/)
  let globalIdx = 0

  for (const seg of segments) {
    if (seg === "\n") {
      list.push({ type: "newline", id: `n-${globalIdx++}` })
      continue
    }
    if (seg === " " || seg === "") {
      if (seg === " ") list.push({ type: "space", id: `s-${globalIdx++}` })
      continue
    }

    const wordSeed = `${documentSeed}-${dnaNonce}-w${globalIdx}-${seg}`
    const wordRng = createRng(wordSeed)
    const wordStyle = buildWordStyle(wordRng, fontWeight)
    const chars = Array.from(seg)
    const charTokens = []

    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci]
      const charRng = createRng(`${wordSeed}-c${ci}`)
      const variant = buildCharVariant(charRng, wordStyle, fontWeight)

      const candidates = glyphMap.get(ch) || []
      const pickRng = createRng(`${wordSeed}-c${ci}-pick-e${editNonce}`)
      const pickIdx = candidates.length > 0 ? Math.floor(pickRng() * candidates.length) : -1
      const glyph = pickIdx >= 0 ? candidates[pickIdx] : null

      charTokens.push({
        type: "char",
        id: `c-${globalIdx}-${ci}`,
        ch,
        variant,
        glyph,
        preview: glyph ? normalizePngDataUrl(glyph.previewInk || glyph.preview || "") : "",
        pickedVersion: glyph?.version ?? null,
      })
    }

    list.push({ type: "word", id: `word-${globalIdx}`, chars: charTokens })
    globalIdx += seg.length
  }

  return list
}

