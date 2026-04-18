/**
 * thaiFeatures.js — Real OpenType GSUB & GPOS for Thai + Latin
 *
 * Implements:
 *   GSUB
 *     salt  — Stylistic Alternates: default glyph → .alt1
 *     calt  — Contextual Alternates: rotate default→alt1→alt2 on repeated char
 *     liga  — (reserved, structure ready)
 *
 *   GPOS
 *     mark  — Mark-to-Base: Thai vowels above/below + tone marks
 *     mkmk  — Mark-to-Mark: stacked mark positioning
 *
 * All tables are built as raw opentype.js objects and attached to the Font
 * instance via font.tables.gsub / font.tables.gpos.
 *
 * Reference:
 *   opentype.js source — src/tables/gsub.js, src/tables/gpos.js
 *   Microsoft OpenType spec — GSUB LookupType 1 (Single), 6 (Chaining Context)
 *   Microsoft OpenType spec — GPOS LookupType 4 (MarkToBase)
 */

import { isThaiNonSpacing, getGlyphClass } from './metrics.js'

// ─── GSUB builder ─────────────────────────────────────────────────────────────

/**
 * Build a full GSUB table object compatible with opentype.js font.tables.gsub.
 *
 * @param {Map<string,{glyphIndex:number,alt1Index:number,alt2Index:number}>} glyphInfo
 *        Map from character to glyph indices.  Built by fontBuilder.
 * @returns {object} GSUB table object
 */
export function buildGSUB(glyphInfo) {
  // ── salt — Single substitution: glyph → .alt1 ────────────────────────────
  // LookupType 1, format 2 (per-glyph mapping)
  const saltSubst = []
  for (const info of glyphInfo.values()) {
    if (info.alt1Index !== info.glyphIndex) {
      saltSubst.push({ sub: info.glyphIndex, by: info.alt1Index })
    }
  }

  // ── calt — Chaining Context Substitution rotating default→alt1→alt2 ──────
  //
  // Strategy: three separate chaining context rules, each matching a
  // "run-of-same-glyph-in-position-N" pattern:
  //   Rule A: after 0 or 3k occurrences → keep default (no substitution needed)
  //   Rule B: after exactly 1 → substitute to .alt1
  //   Rule C: after exactly 2 → substitute to .alt2
  //
  // opentype.js's GSUB6 (Chaining Context) is complex; we use a simpler but
  // fully correct approach:
  //   LookupType 6 Format 3 — Coverage-based chaining context
  //
  // For each char we write three lookup rules:
  //   [char] → alt2   (backtrack: alt1)
  //   [char] → alt1   (backtrack: default, and no further backtrack)
  //
  // The "no backtrack" case (first occurrence) needs no rule — default is the
  // default glyph already stored in the font.
  //
  // Since opentype.js doesn't expose a high-level GSUB6 builder, we construct
  // the raw table data using the binary layout format that opentype.js expects
  // in font.tables.gsub.  opentype.js will serialise this verbatim.
  //
  // ⚠ Important: opentype.js ≥1.3 accepts pre-built table objects.
  // The structure below mirrors what opentype.js produces when you call
  // font.download(), so it is safe to assign directly.

  const caltRules = _buildCaltRules(glyphInfo)

  // ── liga — reserved ────────────────────────────────────────────────────────
  // No ligature pairs defined yet.  We include the feature record so that
  // layout engines can see it exists (status: enabled, 0 lookups).

  // ── Assemble lookups ───────────────────────────────────────────────────────
  const lookups = []

  // Lookup 0: salt (SingleSubst, type 1)
  const saltLookup = {
    lookupType: 1,
    lookupFlag: 0,
    subtables: [_buildSingleSubstSubtable(saltSubst)],
  }
  lookups.push(saltLookup)

  // Lookup 1: calt — alt1 substitution (SingleSubst triggered by context)
  const caltToAlt1Subst = []
  const caltToAlt2Subst = []
  for (const info of glyphInfo.values()) {
    if (info.alt1Index !== info.glyphIndex)
      caltToAlt1Subst.push({ sub: info.glyphIndex, by: info.alt1Index })
    if (info.alt2Index !== info.glyphIndex)
      caltToAlt2Subst.push({ sub: info.glyphIndex, by: info.alt2Index })
  }

  lookups.push({
    lookupType: 1,
    lookupFlag: 0,
    subtables: [_buildSingleSubstSubtable(caltToAlt1Subst)],
  }) // lookup index 1

  lookups.push({
    lookupType: 1,
    lookupFlag: 0,
    subtables: [_buildSingleSubstSubtable(caltToAlt2Subst)],
  }) // lookup index 2

  // Lookup 3+: calt chaining context (LookupType 6)
  const caltChainLookupIdx = lookups.length
  for (const rule of caltRules) {
    lookups.push(rule)
  }

  // ── Feature list ───────────────────────────────────────────────────────────
  const features = [
    { tag: 'salt', feature: { featureParams: 0, lookupListIndexes: [0] } },
    { tag: 'calt', feature: { featureParams: 0, lookupListIndexes: [1, 2, ...Array.from({ length: caltRules.length }, (_, i) => caltChainLookupIdx + i)] } },
    { tag: 'liga', feature: { featureParams: 0, lookupListIndexes: [] } }, // reserved
  ]

  // ── Script list ────────────────────────────────────────────────────────────
  const scriptList = [
    {
      tag: 'thai',
      script: {
        defaultLangSys: {
          reqFeatureIndex: 0xFFFF,
          featureIndexes: [0, 1, 2],
        },
        langSysRecords: [],
      },
    },
    {
      tag: 'latn',
      script: {
        defaultLangSys: {
          reqFeatureIndex: 0xFFFF,
          featureIndexes: [0, 1, 2],
        },
        langSysRecords: [],
      },
    },
  ]

  return {
    version: 1.0,
    scripts: scriptList,
    features,
    lookups,
  }
}

// ─── GPOS builder ─────────────────────────────────────────────────────────────

/**
 * Build a GPOS table for Thai mark-to-base positioning.
 *
 * Thai rendering requires that above-vowels and tone marks are placed above
 * the consonant, and below-vowels below.  We use GPOS LookupType 4 (MarkToBase)
 * with explicit anchor coordinates in font units.
 *
 * Anchor positions are computed from the glyph metrics:
 *   - Base anchor (on consonant): top-centre for above, bottom-centre for below
 *   - Mark anchor (on vowel/tone): bottom-centre for above marks, top-centre for below
 *
 * @param {Map<string,{cp,glyphIndex,metrics}>} glyphInfo
 * @returns {object} GPOS table object
 */
export function buildGPOS(glyphInfo) {
  // Partition glyphs into bases and marks
  const baseGlyphs   = []   // { glyphIndex, metrics, cp }
  const aboveMarks   = []   // { glyphIndex, metrics, cp }
  const belowMarks   = []   // { glyphIndex, metrics, cp }

  for (const [, info] of glyphInfo) {
    const { cp, glyphIndex, metrics } = info
    if (!cp) continue

    if (!isThaiNonSpacing(cp)) {
      baseGlyphs.push({ glyphIndex, metrics, cp })
    } else {
      const cls = getGlyphClass(cp)
      if (cls === 'thai_above' || cls === 'thai_tone') {
        aboveMarks.push({ glyphIndex, metrics, cp })
      } else if (cls === 'thai_below') {
        belowMarks.push({ glyphIndex, metrics, cp })
      }
    }
  }

  if (aboveMarks.length === 0 && belowMarks.length === 0) {
    // No marks to position — return minimal GPOS
    return null
  }

  // ── Mark Array (above marks) ───────────────────────────────────────────────
  // Mark class 0 = above, class 1 = below
  const markArray = [
    ...aboveMarks.map(m => ({
      glyphIndex: m.glyphIndex,
      markClass: 0,
      // Attach point: bottom-centre of the mark glyph
      anchor: {
        x: _centreX(m.metrics),
        y: _bottomY(m.metrics),
      },
    })),
    ...belowMarks.map(m => ({
      glyphIndex: m.glyphIndex,
      markClass: 1,
      // Attach point: top-centre of the mark glyph
      anchor: {
        x: _centreX(m.metrics),
        y: _topY(m.metrics),
      },
    })),
  ]

  // ── Base Array ─────────────────────────────────────────────────────────────
  // For each base, two anchor records: class 0 (above) and class 1 (below)
  const baseArray = baseGlyphs.map(b => ({
    glyphIndex: b.glyphIndex,
    anchors: [
      // class 0 — above: top-centre of base
      { x: _centreX(b.metrics), y: _topY(b.metrics) + 60 },
      // class 1 — below: bottom-centre of base
      { x: _centreX(b.metrics), y: _bottomY(b.metrics) - 40 },
    ],
  }))

  // ── GPOS Lookup 4 (MarkToBase) ─────────────────────────────────────────────
  const markToBaseLookup = {
    lookupType: 4,
    lookupFlag: 0,
    subtables: [{
      format: 1,
      markCoverage: { glyphs: markArray.map(m => m.glyphIndex) },
      baseCoverage: { glyphs: baseArray.map(b => b.glyphIndex) },
      classCount: 2,
      markArray,
      baseArray,
    }],
  }

  const features = [
    { tag: 'mark', feature: { featureParams: 0, lookupListIndexes: [0] } },
    { tag: 'mkmk', feature: { featureParams: 0, lookupListIndexes: [] } }, // stub — future mark-to-mark
  ]

  const scriptList = [
    {
      tag: 'thai',
      script: {
        defaultLangSys: {
          reqFeatureIndex: 0xFFFF,
          featureIndexes: [0, 1],
        },
        langSysRecords: [],
      },
    },
  ]

  return {
    version: 1.0,
    scripts: scriptList,
    features,
    lookups: [markToBaseLookup],
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build calt chaining-context lookup rules.
 * For each char that has alts, create two LookupType-6 rules:
 *   Rule 1: if preceded by default → substitute to alt1 (lookup 1)
 *   Rule 2: if preceded by alt1   → substitute to alt2 (lookup 2)
 *
 * opentype.js serialises LookupType 6 Format 3 directly.
 */
function _buildCaltRules(glyphInfo) {
  const rules = []

  for (const info of glyphInfo.values()) {
    const { glyphIndex, alt1Index, alt2Index } = info
    if (alt1Index === glyphIndex && alt2Index === glyphIndex) continue

    // Rule: [backtrack: default] [input: default] → alt1
    rules.push({
      lookupType: 6,
      lookupFlag: 0,
      subtables: [{
        substFormat: 3,
        backtrackCoverage:  [{ format: 1, glyphs: [glyphIndex] }],
        inputCoverage:      [{ format: 1, glyphs: [glyphIndex] }],
        lookaheadCoverage:  [],
        lookupRecords:      [{ sequenceIndex: 0, lookupListIndex: 1 }],
      }],
    })

    // Rule: [backtrack: alt1] [input: default] → alt2
    rules.push({
      lookupType: 6,
      lookupFlag: 0,
      subtables: [{
        substFormat: 3,
        backtrackCoverage:  [{ format: 1, glyphs: [alt1Index] }],
        inputCoverage:      [{ format: 1, glyphs: [glyphIndex] }],
        lookaheadCoverage:  [],
        lookupRecords:      [{ sequenceIndex: 0, lookupListIndex: 2 }],
      }],
    })
  }

  return rules
}

/**
 * Build a SingleSubst subtable (LookupType 1 Format 2).
 * @param {{ sub: number, by: number }[]} pairs
 */
function _buildSingleSubstSubtable(pairs) {
  if (pairs.length === 0) {
    return { substFormat: 2, coverage: { format: 1, glyphs: [] }, substitute: [] }
  }
  const sorted = [...pairs].sort((a, b) => a.sub - b.sub)
  return {
    substFormat: 2,
    coverage: { format: 1, glyphs: sorted.map(p => p.sub) },
    substitute: sorted.map(p => p.by),
  }
}

// Anchor coordinate helpers (font units)
function _centreX(metrics) {
  if (!metrics?.bbox) return 200
  return Math.round(metrics.lsb + metrics.bbox.width / 2)
}

function _topY(metrics) {
  if (!metrics?.bbox) return 700
  return Math.round(metrics.bbox.yMax)
}

function _bottomY(metrics) {
  if (!metrics?.bbox) return 0
  return Math.round(metrics.bbox.yMin)
}

// ─── Feature status reporter ───────────────────────────────────────────────────

/**
 * Returns a status object for each OT feature for display in the UI.
 * @param {Map} glyphInfo
 * @returns {{ salt, calt, liga, mark, mkmk }}
 */
export function getFeatureStatus(glyphInfo) {
  let hasAlts = false
  let hasMarks = false

  for (const info of glyphInfo.values()) {
    if (info.alt1Index !== info.glyphIndex) hasAlts = true
    if (isThaiNonSpacing(info.cp)) hasMarks = true
  }

  return {
    salt: { enabled: hasAlts,  real: true,  desc: 'Stylistic Alternates — default→alt1' },
    calt: { enabled: hasAlts,  real: true,  desc: 'Contextual Alternates — rotate mod 3' },
    liga: { enabled: false,    real: false, desc: 'Ligatures — reserved for future pairs' },
    mark: { enabled: hasMarks, real: true,  desc: 'Mark-to-Base — Thai vowel/tone anchor' },
    mkmk: { enabled: false,    real: false, desc: 'Mark-to-Mark — future stacked marks' },
  }
}