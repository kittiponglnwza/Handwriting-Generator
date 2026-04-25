/**
 * thaiRenderingAudit.js — Automated Thai rendering regression suite
 *
 * Usage:
 *   import { auditThaiRendering, THAI_TEST_SENTENCES } from './tests/thaiRenderingAudit'
 *   const results = auditThaiRendering(myRenderFn)
 *   console.table(results)
 *
 * Run in QADashboard.jsx or call from ThaiEngine.jsx during dev.
 */

// ─── Test corpus ──────────────────────────────────────────────────────────────

export const THAI_TEST_SENTENCES = [
  // Tone marks (วรรณยุกต์)
  "ฉันไปตลาดมา",
  "น้ำแข็งใส",
  "เก้าอี้ไม้",
  "ผู้ใหญ่ใจดี",
  "ไก่จิกเด็กตาย",

  // Above vowels (สระบน)
  "กิน ดื่ม นอน",
  "ชื่อเสียงเรียงนาม",
  "เขียนหนังสือ",

  // Below vowels (สระล่าง)
  "ครุฑ",
  "ฤดูใบไม้ร่วง",

  // Long compounds
  "กรุงเทพมหานคร",
  "สวัสดีครับ สบายดีไหม",
  "ประเทศไทยมีอากาศร้อน",

  // Mixed Thai-English
  "Hello สวัสดี World",
  "Font ลายมือ Thai",

  // Numbers + Thai
  "วันที่ 25 เมษายน 2568",

  // Rare consonants
  "ฆ่า ฌาน ฎีกา ฏิ ฐาน ฑูต ฒา ณ ศาล ษา ฬ",

  // Edge cases
  "แมวกินปลา",     // ไม้หน้า + สระหลัง
  "โต๊ะเก้าอี้",   // ไม้โอ + ไม้ตรี
  "เที่ยวบิน",     // cluster complex
  "สุขภาพดี",
  "ขอบคุณมากครับ",

  // Multiple lines
  `บรรทัดที่หนึ่ง
บรรทัดที่สอง
บรรทัดที่สาม`,
]

// ─── Thai Unicode ranges ───────────────────────────────────────────────────────

// Tone marks: ่ ้ ๊ ๋ (U+0E48–U+0E4B)
const TONE_MARKS = /[\u0E48\u0E49\u0E4A\u0E4B]/g

// Above vowels: ิ ี ึ ื ั (U+0E34–U+0E38, U+0E47)
const ABOVE_VOWELS = /[\u0E34\u0E35\u0E36\u0E37\u0E38\u0E47]/g

// Below vowels: ุ ู (U+0E38–U+0E39)
const BELOW_VOWELS = /[\u0E38\u0E39]/g

// ─── Detection helpers ────────────────────────────────────────────────────────

/**
 * Detect if a rendered SVG/canvas output has tone marks floating at wrong Y.
 * Strategy: parse any <text> or <tspan> elements; check y-attribute vs baseline.
 * For canvas/pixel mode: look for isolated mark pixels above expected glyph bbox.
 *
 * @param {string|SVGElement} output - SVG string or DOM element
 * @returns {boolean}
 */
export function detectFloatingMark(output) {
  if (!output) return false

  // SVG string mode — look for tone mark chars with suspiciously large y delta
  if (typeof output === 'string') {
    // Find all y="..." attributes in text elements
    const yValues = []
    const yRe = /y="([\d.]+)"/g
    let m
    while ((m = yRe.exec(output)) !== null) {
      yValues.push(parseFloat(m[1]))
    }
    if (yValues.length < 2) return false

    // Baseline is typically the median y
    yValues.sort((a, b) => a - b)
    const baseline = yValues[Math.floor(yValues.length / 2)]
    const minY = yValues[0]

    // If the topmost element is >30% of total height above baseline, flag it
    const totalHeight = yValues[yValues.length - 1] - minY
    if (totalHeight > 0 && (baseline - minY) / totalHeight > 0.45) {
      return true
    }
    return false
  }

  // DOM mode — inspect getBoundingClientRect of mark characters
  if (output && typeof output.querySelectorAll === 'function') {
    const marks = output.querySelectorAll('[data-char-type="tone-mark"]')
    const bases = output.querySelectorAll('[data-char-type="consonant"]')
    if (!marks.length || !bases.length) return false

    const baseTop = Math.min(...[...bases].map(el => el.getBoundingClientRect().top))
    for (const mark of marks) {
      const rect = mark.getBoundingClientRect()
      // Mark should be above base but within 2× line-height — flag if too far up
      if (baseTop - rect.top > 40) return true
    }
  }

  return false
}

/**
 * Detect abnormal spacing between Thai characters.
 * Thai characters should not have inter-character gaps wider than ~1.2× em.
 *
 * @param {string} output - SVG string
 * @returns {boolean}
 */
export function detectWrongSpacing(output) {
  if (!output || typeof output !== 'string') return false

  const xValues = []
  const xRe = /x="([\d.]+)"/g
  let m
  while ((m = xRe.exec(output)) !== null) {
    xValues.push(parseFloat(m[1]))
  }
  if (xValues.length < 2) return false

  // Sort and check max gap
  xValues.sort((a, b) => a - b)
  let maxGap = 0
  for (let i = 1; i < xValues.length; i++) {
    maxGap = Math.max(maxGap, xValues[i] - xValues[i - 1])
  }

  const totalWidth = xValues[xValues.length - 1] - xValues[0]
  const avgGap = totalWidth / (xValues.length - 1)

  // If max gap is >3× average, something is wrong
  return maxGap > avgGap * 3
}

/**
 * Detect broken line-height: lines that overlap or have excessive gap.
 *
 * @param {string} output - SVG string
 * @returns {boolean}
 */
export function detectLineHeightIssue(output) {
  if (!output || typeof output !== 'string') return false

  // Find all unique y-values (different text lines)
  const ySet = new Set()
  const yRe = /y="([\d.]+)"/g
  let m
  while ((m = yRe.exec(output)) !== null) {
    ySet.add(Math.round(parseFloat(m[1])))
  }

  const yLines = [...ySet].sort((a, b) => a - b)
  if (yLines.length < 2) return false

  const gaps = []
  for (let i = 1; i < yLines.length; i++) {
    gaps.push(yLines[i] - yLines[i - 1])
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const maxGap = Math.max(...gaps)
  const minGap = Math.min(...gaps)

  // Inconsistent line heights (gap varies >60%) or lines overlapping
  if (minGap <= 0) return true  // overlap
  if (maxGap / minGap > 2.5) return true   // inconsistent spacing

  return false
}

// ─── Main audit runner ────────────────────────────────────────────────────────

/**
 * Run all Thai test sentences through a render function and collect results.
 *
 * @param {Function} renderFn - (sentence: string) => string|SVGElement
 *   The function that renders Thai text and returns SVG/DOM/string output.
 *
 * @returns {Array<{
 *   input: string,
 *   hasFloatingMark: boolean,
 *   hasWrongSpacing: boolean,
 *   hasBrokenLineHeight: boolean,
 *   pass: boolean,
 * }>}
 */
export function auditThaiRendering(renderFn) {
  const results = []

  for (const sentence of THAI_TEST_SENTENCES) {
    let output = null
    let renderError = null

    try {
      output = renderFn(sentence)
    } catch (err) {
      renderError = err.message
    }

    const hasFloatingMark    = renderError ? false : detectFloatingMark(output)
    const hasWrongSpacing    = renderError ? false : detectWrongSpacing(output)
    const hasBrokenLineHeight = renderError ? false : detectLineHeightIssue(output)

    results.push({
      input: sentence.length > 30 ? sentence.slice(0, 30) + '…' : sentence,
      hasFloatingMark,
      hasWrongSpacing,
      hasBrokenLineHeight,
      renderError: renderError ?? null,
      pass: !renderError && !hasFloatingMark && !hasWrongSpacing && !hasBrokenLineHeight,
    })
  }

  return results
}

/**
 * Print a summary table to console.
 * Call this in dev mode from QADashboard or a test script.
 */
export function printAuditSummary(results) {
  const total  = results.length
  const passed = results.filter(r => r.pass).length
  const failed = total - passed

  console.group(`🇹🇭 Thai Rendering Audit — ${passed}/${total} passed`)

  if (failed > 0) {
    console.warn(`❌ ${failed} sentence(s) failed:`)
    results
      .filter(r => !r.pass)
      .forEach(r => {
        const issues = [
          r.renderError    && `render error: ${r.renderError}`,
          r.hasFloatingMark     && 'floating tone mark',
          r.hasWrongSpacing     && 'wrong spacing',
          r.hasBrokenLineHeight && 'broken line-height',
        ].filter(Boolean).join(', ')
        console.warn(`  "${r.input}" → ${issues}`)
      })
  } else {
    console.info('✅ All sentences passed')
  }

  console.groupEnd()
  return { total, passed, failed }
}
