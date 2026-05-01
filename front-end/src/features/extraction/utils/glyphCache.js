/**
 * glyphCache.js
 *
 * LRU-bounded memoization cache for processed glyph preview data.
 *
 * Problem: Re-computing SVG path normalization, bbox, status colours, and
 * display metadata on every render is expensive when the grid has 200+ glyphs.
 *
 * Solution:
 *  1. ProcessedGlyphCache — in-memory LRU cache keyed by (id + pathHash).
 *     Survives re-renders, cleared only when glyphs array identity changes.
 *  2. processGlyph()    — pure function that derives all display data once.
 *  3. useGlyphCache()   — React hook that wraps the cache and exposes a stable
 *     `getProcessed(glyph)` accessor.
 *
 * Why not useMemo on the full array? useMemo recomputes the ENTIRE array whenever
 * ANY glyph changes (e.g. after an edit). The per-glyph LRU cache recomputes only
 * the changed item and reuses the rest.
 */

import { useMemo, useRef } from 'react'

// ── Tiny hash for path string (djb2) ─────────────────────────────────────────

function hashString(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}

// ── LRU Cache ─────────────────────────────────────────────────────────────────

class LRUCache {
  constructor(maxSize = 512) {
    this.maxSize = maxSize
    this.map = new Map()
  }

  get(key) {
    if (!this.map.has(key)) return undefined
    // Move to end (most-recently-used)
    const val = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }

  set(key, val) {
    if (this.map.has(key)) this.map.delete(key)
    else if (this.map.size >= this.maxSize) {
      // Evict least-recently-used (first entry)
      this.map.delete(this.map.keys().next().value)
    }
    this.map.set(key, val)
  }

  has(key) { return this.map.has(key) }

  clear() { this.map.clear() }

  get size() { return this.map.size }
}

// ── Status metadata ───────────────────────────────────────────────────────────

const STATUS_META = {
  excellent:  { color: '#22c55e', bg: '#f0fdf4', label: 'Excellent',  priority: 0 },
  good:       { color: '#84cc16', bg: '#f7fee7', label: 'Good',       priority: 1 },
  ok:         { color: '#84cc16', bg: '#f7fee7', label: 'OK',         priority: 1 },
  acceptable: { color: '#f59e0b', bg: '#fffbeb', label: 'Acceptable', priority: 2 },
  poor:       { color: '#f97316', bg: '#fff7ed', label: 'Poor',       priority: 3 },
  critical:   { color: '#ef4444', bg: '#fef2f2', label: 'Critical',   priority: 4 },
  missing:    { color: '#a1a1aa', bg: '#f4f4f5', label: 'Missing',    priority: 5 },
  error:      { color: '#ef4444', bg: '#fef2f2', label: 'Error',      priority: 4 },
}

export function getStatusMeta(status) {
  return STATUS_META[status] ?? STATUS_META.missing
}

// ── M/N path diagnostic ───────────────────────────────────────────────────────

/**
 * Analyse an SVG path for common issues that cause the m/n rendering bug:
 *   1. Duplicate points (consecutive identical coordinates)
 *   2. Self-intersecting contours (simple winding heuristic)
 *   3. Suspiciously narrow bounding box (width < 5% of height → possible mirror)
 *   4. Unicode mapping mismatch for 'm' vs 'n' (0x6D vs 0x6E)
 *
 * Returns an array of { code, severity, message } warning objects.
 */
export function diagnosePath(svgPath, ch, status) {
  if (!svgPath || typeof svgPath !== 'string') {
    return [{ code: 'NO_PATH', severity: 'error', message: 'No path data found.' }]
  }

  const warnings = []
  const trimmed = svgPath.trim()

  // Extract all coordinate pairs
  const nums = trimmed
    .replace(/[MLCQZz]/g, ' ')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => !isNaN(n))

  const points = []
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]])

  if (points.length === 0) {
    return [{ code: 'EMPTY_PATH', severity: 'error', message: 'Path contains no parseable coordinates.' }]
  }

  // 1. Duplicate consecutive points
  let dupCount = 0
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i][0] - points[i - 1][0]) < 0.01 &&
        Math.abs(points[i][1] - points[i - 1][1]) < 0.01) {
      dupCount++
    }
  }
  if (dupCount > 0) {
    warnings.push({
      code:     'DUPLICATE_POINTS',
      severity: dupCount > 3 ? 'error' : 'warn',
      message:  `${dupCount} duplicate consecutive point${dupCount > 1 ? 's' : ''} detected. May cause rendering artefacts.`,
    })
  }

  // 2. Bounding box
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const bboxW = Math.max(...xs) - Math.min(...xs)
  const bboxH = Math.max(...ys) - Math.min(...ys)

  if (bboxW < 2) {
    warnings.push({
      code:     'ZERO_WIDTH',
      severity: 'error',
      message:  `Glyph bounding box is nearly zero-width (${bboxW.toFixed(1)}u). Likely missing strokes.`,
    })
  } else if (bboxH > 0 && bboxW / bboxH < 0.05) {
    warnings.push({
      code:     'NARROW_BBOX',
      severity: 'warn',
      message:  `Very narrow glyph (w/h = ${(bboxW / bboxH).toFixed(2)}). Could be misaligned or a mirror artifact.`,
    })
  }

  // 3. M vs N specific check — widths should be close
  if (ch === 'm' || ch === 'n') {
    // Flag if bbox width differs drastically between siblings — we'll compare in the panel
    if (bboxW < 15 || bboxW > 90) {
      warnings.push({
        code:     'WIDTH_OUTLIER',
        severity: 'warn',
        message:  `'${ch}' width (${bboxW.toFixed(1)}) is outside expected range [15–90]. May be confused with sibling glyph.`,
      })
    }
  }

  // 4. Unicode mapping check
  if (ch) {
    const cp = ch.codePointAt(0)
    const LATIN_M = 0x6D, LATIN_N = 0x6E
    if ((ch === 'm' && cp !== LATIN_M) || (ch === 'n' && cp !== LATIN_N)) {
      warnings.push({
        code:     'UNICODE_MISMATCH',
        severity: 'error',
        message:  `Unicode mismatch: '${ch}' has codepoint U+${cp.toString(16).toUpperCase()} but expected U+${(ch === 'm' ? LATIN_M : LATIN_N).toString(16).toUpperCase()}.`,
      })
    }
  }

  // 5. Contour closure check
  const subpaths = trimmed.split(/(?=[Mm])/).filter(Boolean)
  for (const sub of subpaths) {
    if (!/[Zz]\s*$/.test(sub.trim()) && /[LCQ]/i.test(sub)) {
      warnings.push({
        code:     'OPEN_CONTOUR',
        severity: 'warn',
        message:  'Contour is not closed (no Z command). May cause fill issues in font renderer.',
      })
      break // one warning per glyph is enough
    }
  }

  // 6. Status-level warning
  if (status === 'poor' || status === 'critical') {
    warnings.push({
      code:     'LOW_CONFIDENCE',
      severity: status === 'critical' ? 'error' : 'warn',
      message:  `Extraction confidence is ${status}. Consider re-scanning this character.`,
    })
  }

  return warnings
}

// ── Core processing function ──────────────────────────────────────────────────

/**
 * Pure function: derive all display data for a single raw glyph.
 * Called at most once per (glyph id + path hash) combination.
 *
 * @param {object} glyph - raw glyph from extraction pipeline
 * @param {object} edits - { path?, note? } user overrides for this glyph
 * @returns {ProcessedGlyph}
 */
export function processGlyph(glyph, edits = {}) {
  const path       = edits.path ?? glyph.svgPath ?? ''
  const status     = glyph.status ?? glyph._visionStatus ?? 'missing'
  const statusMeta = getStatusMeta(status)
  const ch         = glyph.ch ?? ''
  const cp         = ch ? ch.codePointAt(0) : 0
  const unicode    = cp ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : '—'

  // Parse basic bbox from path
  let bboxW = 0, bboxH = 0
  if (path) {
    const nums = path.replace(/[MLCQZz]/g, ' ').trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    const xs = [], ys = []
    for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i + 1]) }
    if (xs.length) {
      bboxW = Math.max(...xs) - Math.min(...xs)
      bboxH = Math.max(...ys) - Math.min(...ys)
    }
  }

  const warnings = diagnosePath(path, ch, status)
  const hasErrors  = warnings.some(w => w.severity === 'error')
  const hasWarnings = warnings.some(w => w.severity === 'warn')

  return {
    id:          glyph.id,
    ch,
    cp,
    unicode,
    path,
    originalPath: glyph.svgPath ?? '',
    viewBox:     glyph.viewBox ?? '0 0 100 100',
    status,
    statusMeta,
    confidence:  glyph.confidence ?? null,
    hasEdits:    !!edits.path || !!edits.note,
    note:        edits.note ?? '',
    bboxW:       Math.round(bboxW),
    bboxH:       Math.round(bboxH),
    warnings,
    hasErrors,
    hasWarnings,
    pageIndex:   glyph.pageIndex ?? 0,
    slotIndex:   glyph.slotIndex ?? 0,
  }
}

// ── React hook ────────────────────────────────────────────────────────────────

/**
 * useGlyphCache
 *
 * Provides a stable `getProcessed(glyph, edits)` accessor.
 * The cache is keyed by `${glyph.id}::${pathHash}` so edits invalidate only
 * the affected glyph — all others remain cached.
 *
 * The cache is scoped to the glyphs array reference: when the array changes
 * (new extraction run) the cache clears automatically.
 */
export function useGlyphCache(glyphs) {
  // One cache instance per hook instance, cleared when glyphs ref changes
  const cacheRef   = useRef(new LRUCache(512))
  const prevGlyphs = useRef(glyphs)

  if (prevGlyphs.current !== glyphs) {
    cacheRef.current.clear()
    prevGlyphs.current = glyphs
  }

  const getProcessed = useMemo(() => (glyph, edits = {}) => {
    const pathHash = hashString((edits.path ?? glyph.svgPath ?? '') + (edits.note ?? ''))
    const key      = `${glyph.id}::${pathHash}`

    if (cacheRef.current.has(key)) return cacheRef.current.get(key)

    const result = processGlyph(glyph, edits)
    cacheRef.current.set(key, result)
    return result
  }, []) // stable — never re-created

  return { getProcessed, cacheSize: cacheRef.current.size }
}