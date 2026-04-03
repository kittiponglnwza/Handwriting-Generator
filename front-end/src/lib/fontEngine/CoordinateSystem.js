// CoordinateSystem.js - Font coordinate system following OpenType conventions
// Handles transformation between font units and screen coordinates

import { FONT_METRICS } from './Glyph.js'

/**
 * Coordinate system for font rendering
 * Follows OpenType conventions with 1000 units per em
 */
export class CoordinateSystem {
  constructor() {
    this.unitsPerEm = FONT_METRICS.unitsPerEm
    this.baseline = FONT_METRICS.baseline
    this.ascent = FONT_METRICS.ascent
    this.descent = FONT_METRICS.descent
  }

  /**
   * Convert font units to pixels at given font size
   * @param {number} units - Value in font units
   * @param {number} fontSize - Font size in pixels
   * @returns {number} Value in pixels
   */
  unitsToPixels(units, fontSize) {
    return (units / this.unitsPerEm) * fontSize
  }

  /**
   * Convert pixels to font units
   * @param {number} pixels - Value in pixels
   * @param {number} fontSize - Font size in pixels
   * @returns {number} Value in font units
   */
  pixelsToUnits(pixels, fontSize) {
    return (pixels / fontSize) * this.unitsPerEm
  }

  /**
   * Get baseline position in pixels (from top of line)
   * @param {number} fontSize - Font size in pixels
   * @returns {number} Baseline position in pixels
   */
  getBaselinePosition(fontSize) {
    const totalHeight = this.ascent - this.descent
    const baselineRatio = this.ascent / totalHeight
    return fontSize * baselineRatio
  }

  /**
   * Get line height in pixels
   * @param {number} fontSize - Font size in pixels
   * @param {number} lineHeightMultiplier - Line height multiplier (default 1.2)
   * @returns {number} Line height in pixels
   */
  getLineHeight(fontSize, lineHeightMultiplier = 1.2) {
    return fontSize * lineHeightMultiplier
  }

  /**
   * Transform glyph coordinates to screen coordinates
   * @param {Object} glyph - Glyph object
   * @param {number} fontSize - Font size in pixels
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels (baseline)
   * @returns {Object} Transformed coordinates
   */
  transformGlyph(glyph, fontSize, x = 0, y = 0) {
    // NOTE: glyph paths in this engine use top-of-line-box as origin (y increases downward),
    // NOT the OpenType baseline convention. So we do NOT add baselinePos here.
    // y parameter = top of the current line box.
    const scale = fontSize / this.unitsPerEm

    return {
      x: x + this.unitsToPixels(glyph.leftBearing, fontSize),
      y: y + this.unitsToPixels(glyph.baselineOffset, fontSize),
      scale: scale,
      advanceWidth: this.unitsToPixels(glyph.advanceWidth, fontSize),
      totalWidth: this.unitsToPixels(glyph.totalWidth, fontSize),
      baselinePosition: 0,
    }
  }

  /**
   * Transform anchor point coordinates
   * @param {Object} anchor - Anchor point with x, y in font units
   * @param {number} fontSize - Font size in pixels
   * @param {number} baseX - Base X position in pixels
   * @param {number} baseY - Base Y position in pixels (baseline)
   * @returns {Object} Transformed anchor coordinates
   */
  transformAnchor(anchor, fontSize, baseX, baseY) {
    const scale = fontSize / this.unitsPerEm
    return {
      x: baseX + this.unitsToPixels(anchor.x, fontSize),
      y: baseY - this.unitsToPixels(anchor.y, fontSize),
      scale: scale,
    }
  }

  /**
   * Get bounding box for text line
   * @param {Array} glyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Bounding box {x, y, width, height}
   */
  getTextBounds(glyphs, fontSize) {
    if (glyphs.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const baselinePos = this.getBaselinePosition(fontSize)

    glyphs.forEach(glyph => {
      const x = glyph.x || 0
      const y = glyph.y || baselinePos
      const width = glyph.totalWidth || 0
      const height = fontSize // Approximate height

      minX = Math.min(minX, x)
      minY = Math.min(minY, y - height * 0.8) // Account for ascent
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height * 0.2) // Account for descent
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Calculate optimal SVG viewBox for text
   * @param {Array} glyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @param {number} padding - Padding in pixels
   * @returns {string} SVG viewBox string
   */
  calculateViewBox(glyphs, fontSize, padding = 20) {
    const bounds = this.getTextBounds(glyphs, fontSize)
    return `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`
  }
}

// Export singleton instance
export const coordinateSystem = new CoordinateSystem()