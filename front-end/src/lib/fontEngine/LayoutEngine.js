// LayoutEngine.js - Font layout engine with kerning and positioning
// Handles glyph positioning, spacing, and multi-line layout

import { coordinateSystem } from './CoordinateSystem.js'
import { globalGlyphCache } from './Glyph.js'
import { parseThaiWithMetadata } from './ThaiClusterParser.js'

/**
 * Kerning system for glyph pairs
 */
export class KerningSystem {
  constructor() {
    this.kerningPairs = new Map()
    this.loadDefaultKerning()
  }

  /**
   * Add a kerning pair
   * @param {string} leftChar - Left character
   * @param {string} rightChar - Right character
   * @param {number} adjustment - Kerning adjustment in font units
   */
  addKerningPair(leftChar, rightChar, adjustment) {
    const key = `${leftChar}${rightChar}`
    this.kerningPairs.set(key, adjustment)
  }

  /**
   * Get kerning adjustment for a glyph pair
   * @param {string} leftChar - Left character
   * @param {string} rightChar - Right character
   * @returns {number} Kerning adjustment in font units
   */
  getKerningAdjustment(leftChar, rightChar) {
    const key = `${leftChar}${rightChar}`
    return this.kerningPairs.get(key) || 0
  }

  /**
   * Load default Thai kerning pairs
   */
  loadDefaultKerning() {
    // Thai consonant + mark combinations
    this.addKerningPair('ก', 'ิ', -8)
    this.addKerningPair('ก', 'ี', -12)
    this.addKerningPair('ก', '่', -10)
    this.addKerningPair('ก', '้', -15)
    
    this.addKerningPair('ข', 'ิ', -8)
    this.addKerningPair('ข', 'ี', -12)
    this.addKerningPair('ข', '่', -10)
    this.addKerningPair('ข', '้', -15)
    
    this.addKerningPair('ค', 'ิ', -8)
    this.addKerningPair('ค', 'ี', -12)
    this.addKerningPair('ค', '่', -10)
    this.addKerningPair('ค', '้', -15)
    
    this.addKerningPair('ร', 'า', -8)
    this.addKerningPair('ร', 'ำ', -10)
    this.addKerningPair('ร', 'ิ', -6)
    this.addKerningPair('ร', 'ี', -10)
    
    this.addKerningPair('น', 'า', -8)
    this.addKerningPair('น', 'ำ', -10)
    this.addKerningPair('น', 'ิ', -6)
    this.addKerningPair('น', 'ี', -10)
    
    // Leading vowel + consonant combinations
    this.addKerningPair('เ', 'ก', -5)
    this.addKerningPair('เ', 'ข', -5)
    this.addKerningPair('เ', 'ค', -5)
    this.addKerningPair('เ', 'ร', -3)
    this.addKerningPair('เ', 'น', -3)
    
    // Mark + mark combinations
    this.addKerningPair('ิ', '่', -5)
    this.addKerningPair('ิ', '้', -8)
    this.addKerningPair('ี', '่', -5)
    this.addKerningPair('ี', '้', -8)
    
    // Space adjustments
    this.addKerningPair(' ', 'ก', 0)
    this.addKerningPair('ก', ' ', 0)
  }

  /**
   * Load kerning from JSON data
   * @param {Object} kerningData - Object with kerning pairs
   */
  loadFromJSON(kerningData) {
    Object.entries(kerningData).forEach(([pair, adjustment]) => {
      if (pair.length === 2 && typeof adjustment === 'number') {
        this.addKerningPair(pair[0], pair[1], adjustment)
      }
    })
  }

  /**
   * Get all kerning pairs
   * @returns {Object} Kerning pairs object
   */
  getAllKerningPairs() {
    const result = {}
    for (const [key, value] of this.kerningPairs) {
      result[key] = value
    }
    return result
  }
}

/**
 * Positioned glyph class
 */
export class PositionedGlyph {
  /**
   * @param {Object} glyph - Glyph object
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels (baseline)
   * @param {Object} transformed - Transformed coordinates from coordinate system
   * @param {Object} variation - Natural variation applied
   * @param {number} clusterIndex - Index in cluster
   * @param {string} anchorType - Anchor type for combining marks
   */
  constructor(glyph, x, y, transformed, variation = {}, clusterIndex = 0, anchorType = null) {
    this.glyph = glyph
    this.x = x
    this.y = y
    this.transformed = transformed
    this.variation = variation
    this.clusterIndex = clusterIndex
    this.anchorType = anchorType
  }

  /**
   * Get final transform string for SVG
   * @returns {string} SVG transform string
   */
  getTransform() {
    const { x, y, scale } = this.transformed
    const { rotation = 0, offsetX = 0, offsetY = 0 } = this.variation
    
    const finalX = x + offsetX
    const finalY = y + offsetY
    const finalScale = scale * (this.variation.scale || 1)
    
    return `translate(${finalX}, ${finalY}) scale(${finalScale}) rotate(${rotation})`
  }
}

/**
 * Layout engine for text rendering
 */
export class LayoutEngine {
  constructor(options = {}) {
    this.options = {
      letterSpacing: 0,
      lineHeight: 1.2,
      maxWidth: Infinity,
      kerning: true,
      ...options
    }
    
    this.kerningSystem = new KerningSystem()
    this.coordinateSystem = coordinateSystem
  }

  /**
   * Layout text into positioned glyphs
   * @param {string} text - Input text
   * @param {number} fontSize - Font size in pixels
   * @returns {Array<PositionedGlyph>} Array of positioned glyphs
   */
  layoutText(text, fontSize) {
    if (!text) return []
    
    // CRITICAL FIX: Use proper Thai cluster parsing
    const clusters = parseThaiWithMetadata(text)
    const positionedGlyphs = []
    
    let currentX = 0
    let currentY = 0
    let previousBaseChar = null
    
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      const clusterData = clusters[clusterIndex]
      const cluster = clusterData.cluster
      
      // Handle newline
      if (cluster.text === '\n') {
        currentX = 0
        currentY += this.coordinateSystem.getLineHeight(fontSize, this.options.lineHeight)
        previousBaseChar = null
        continue
      }
      
      // Handle space - CRITICAL FIX: Do NOT render space as glyph
      if (cluster.text === ' ') {
        // Space uses advance width without rendering glyph
        const spaceWidth = this.coordinateSystem.unitsToPixels(300, fontSize) // Standard space width
        currentX += spaceWidth + this.options.letterSpacing
        previousBaseChar = ' '
        continue
      }
      
      // CRITICAL FIX: Check line wrapping BEFORE laying out cluster
      // Calculate cluster width to check if it fits on current line
      const clusterWidth = this.calculateClusterWidth(cluster, fontSize, previousBaseChar)
      const wouldExceedWidth = this.options.maxWidth !== Infinity && 
                            (currentX + clusterWidth) > this.options.maxWidth
      
      if (wouldExceedWidth) {
        // Move to new line
        currentX = 0
        currentY += this.coordinateSystem.getLineHeight(fontSize, this.options.lineHeight)
        previousBaseChar = null
      }
      
      // Layout cluster on current line (or new line if wrapped)
      const clusterGlyphs = this.layoutThaiCluster(cluster, fontSize, currentX, currentY, previousBaseChar)
      positionedGlyphs.push(...clusterGlyphs)
      
      // CRITICAL FIX: Update position based on cluster's base character ONLY
      if (clusterGlyphs.length > 0) {
        const baseGlyph = clusterGlyphs.find(g => !g.anchorType) // Base character (no anchor type)
        if (baseGlyph) {
          // Use ONLY the base character's advanceWidth for spacing
          currentX += baseGlyph.transformed.advanceWidth + this.options.letterSpacing
          previousBaseChar = cluster.baseChar
        } else {
          // Fallback: use first glyph's advanceWidth
          currentX += clusterGlyphs[0].transformed.advanceWidth + this.options.letterSpacing
          previousBaseChar = cluster.text[0]
        }
      }
    }
    
    return positionedGlyphs
  }

  /**
   * Calculate the width of a cluster for line wrapping purposes
   * @param {ThaiCluster} cluster - Thai cluster object
   * @param {number} fontSize - Font size in pixels
   * @param {string} previousBaseChar - Previous base character for kerning
   * @returns {number} Cluster width in pixels
   */
  calculateClusterWidth(cluster, fontSize, previousBaseChar) {
    // CRITICAL FIX: Get base character for width calculation
    const baseChar = cluster.baseChar
    const baseGlyph = baseChar ? globalGlyphCache.getWithFallback(baseChar) : null
    
    if (!baseGlyph) {
      // Fallback: estimate width from first character for non-Thai clusters
      const firstChar = cluster.text[0]
      const firstGlyph = globalGlyphCache.getWithFallback(firstChar)
      return this.coordinateSystem.unitsToPixels(firstGlyph.advanceWidth, fontSize) + this.options.letterSpacing
    }
    
    // Apply kerning adjustment
    let kerningAdjustment = 0
    if (this.options.kerning && previousBaseChar && baseChar) {
      kerningAdjustment = this.kerningSystem.getKerningAdjustment(previousBaseChar, baseChar)
    }
    
    // CRITICAL FIX: Cluster width = base character's advance width + kerning + letter spacing
    // Marks (upper/lower) should NOT contribute to width
    const baseWidth = baseGlyph.advanceWidth + kerningAdjustment
    return this.coordinateSystem.unitsToPixels(baseWidth, fontSize) + this.options.letterSpacing
  }

  /**
   * Layout a single Thai cluster
   * @param {ThaiCluster} cluster - Thai cluster object
   * @param {number} fontSize - Font size in pixels
   * @param {number} x - Starting X position
   * @param {number} y - Baseline Y position
   * @param {string} previousBaseChar - Previous base character for kerning
   * @returns {Array<PositionedGlyph>} Array of positioned glyphs
   */
  layoutThaiCluster(cluster, fontSize, x, y, previousBaseChar) {
    const positionedGlyphs = []
    const renderingOrder = cluster.getRenderingOrder()
    
    // Get base character for anchor positioning
    const baseChar = cluster.baseChar
    const baseGlyph = baseChar ? globalGlyphCache.getWithFallback(baseChar) : null
    
    // Apply kerning to base character
    let kerningAdjustment = 0
    if (this.options.kerning && previousBaseChar && baseChar) {
      kerningAdjustment = this.kerningSystem.getKerningAdjustment(previousBaseChar, baseChar)
    }
    
    const adjustedX = x + this.coordinateSystem.unitsToPixels(kerningAdjustment, fontSize)

    // CRITICAL FIX: Pre-compute baseGlyphTransformed in a first pass so that
    // marks can use it regardless of rendering order. Previously, if a mark was
    // encountered before baseGlyphTransformed was set (impossible given
    // getRenderingOrder but still a latent risk), it fell back to the wrong
    // position — and with the leading-vowel cluster-boundary bug this could
    // produce marks that were laid out on a fresh line without any base context.
    let baseGlyphTransformed = null
    if (baseGlyph) {
      baseGlyphTransformed = this.coordinateSystem.transformGlyph(baseGlyph, fontSize, adjustedX, y)
    }
    
    // Layout each character in the cluster
    renderingOrder.forEach((char, index) => {
      const glyph = globalGlyphCache.getWithFallback(char)
      const isMark = cluster.getCombiningMarks().some(mark => mark.char === char)
      
      let glyphX = adjustedX
      let glyphY = y // Always start at baseline
      let anchorType = null
      
      if (isMark) {
        // Simple offset positioning — same approach as normal fonts.
        // All marks share the same X as the base character (they are zero-width).
        // Y offset is a fixed fraction of fontSize relative to the cluster baseline.
        // This bypasses the broken multi-layer anchor/transform pipeline entirely.
        const markType = cluster.getCombiningMarks().find(mark => mark.char === char)?.type
        anchorType = markType
        glyphX = adjustedX
        glyphY = y + this.getMarkOffset(markType, fontSize)
      } else if (char === baseChar) {
        // Base character uses adjusted position
        glyphX = adjustedX
        glyphY = y // Base character always on baseline
      } else {
        // Leading vowels and other non-mark characters — same baseline as base char
        glyphX = adjustedX
        glyphY = y
      }
      
      const transformed = this.coordinateSystem.transformGlyph(glyph, fontSize, glyphX, glyphY)
      
      const positionedGlyph = new PositionedGlyph(
        glyph,
        glyphX,
        glyphY,
        transformed,
        {},
        index,
        anchorType
      )
      
      positionedGlyphs.push(positionedGlyph)
    })
    
    return positionedGlyphs
  }

  /**
   * Get fallback offset for marks when no anchor is available
   * @param {string} markType - Type of mark ('top' or 'bottom')
   * @param {number} fontSize - Font size in pixels
   * @returns {number} Offset in pixels
   */
  getMarkOffset(markType, fontSize) {
    switch (markType) {
      case 'top':
        // Upper mark paths are now drawn at negative y (y ≈ -300 to -150 font units),
        // which places them visually above the base character. No extra offset needed.
        return 0
      case 'bottom':
        // Lower mark paths are now drawn at y ≈ 950-1000 font units,
        // which places them visually below the base character. No extra offset needed.
        return 0
      default:
        return 0
    }
  }

  /**
   * Calculate text bounds
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Bounding box {x, y, width, height}
   */
  calculateBounds(positionedGlyphs, fontSize) {
    return this.coordinateSystem.getTextBounds(positionedGlyphs, fontSize)
  }

  /**
   * Calculate optimal SVG viewBox
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @param {number} padding - Padding in pixels
   * @returns {string} SVG viewBox string
   */
  calculateViewBox(positionedGlyphs, fontSize, padding = 20) {
    return this.coordinateSystem.calculateViewBox(positionedGlyphs, fontSize, padding)
  }

  /**
   * Update layout options
   * @param {Object} newOptions - New layout options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
  }

  /**
   * Get kerning system instance
   * @returns {KerningSystem} Kerning system
   */
  getKerningSystem() {
    return this.kerningSystem
  }
}

/**
 * Convenience function to layout text
 * @param {string} text - Input text
 * @param {number} fontSize - Font size in pixels
 * @param {Object} options - Layout options
 * @returns {Array<PositionedGlyph>} Array of positioned glyphs
 */
export function layoutText(text, fontSize, options = {}) {
  const engine = new LayoutEngine(options)
  return engine.layoutText(text, fontSize)
}

/**
 * Export singleton layout engine instance
 */
export const layoutEngine = new LayoutEngine()