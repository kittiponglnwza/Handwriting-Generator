// LayoutEngine.js - Font layout engine with kerning and positioning
// Handles glyph positioning, spacing, and multi-line layout

import { coordinateSystem } from './CoordinateSystem.js'
import { globalGlyphCache } from './Glyph.js'
import { parseGraphemeClustersWithMetadata } from './GraphemeCluster.js'

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
    
    const clusters = parseGraphemeClustersWithMetadata(text)
    const positionedGlyphs = []
    
    let currentX = 0
    let currentY = 0
    let previousChar = null
    
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      const clusterData = clusters[clusterIndex]
      const cluster = clusterData.cluster
      
      // Handle newline
      if (cluster.text === '\n') {
        currentX = 0
        currentY += this.coordinateSystem.getLineHeight(fontSize, this.options.lineHeight)
        previousChar = null
        continue
      }
      
      // Handle space - CRITICAL FIX: Do NOT render space as glyph
      if (cluster.text === ' ') {
        // Space uses advance width without rendering glyph
        const spaceWidth = this.coordinateSystem.unitsToPixels(300, fontSize) // Standard space width
        currentX += spaceWidth + this.options.letterSpacing
        previousChar = ' '
        continue
      }
      
      // Layout cluster
      const clusterGlyphs = this.layoutCluster(cluster, fontSize, currentX, currentY, previousChar)
      positionedGlyphs.push(...clusterGlyphs)
      
      // Update position for next cluster - CRITICAL FIX: Use base character's advanceWidth
      if (clusterGlyphs.length > 0) {
        const baseGlyph = clusterGlyphs.find(g => g.anchorType === null || g.anchorType === undefined) // Base character
        if (baseGlyph) {
          // Use ONLY the base character's advanceWidth for spacing
          currentX += baseGlyph.transformed.advanceWidth + this.options.letterSpacing
        } else {
          // Fallback: use first glyph
          currentX += clusterGlyphs[0].transformed.advanceWidth + this.options.letterSpacing
        }
        previousChar = cluster.baseChar || cluster.text
      }
      
      // Check for line wrapping
      if (this.options.maxWidth !== Infinity && currentX > this.options.maxWidth) {
        currentX = 0
        currentY += this.coordinateSystem.getLineHeight(fontSize, this.options.lineHeight)
        
        // Reposition the current cluster on new line
        const repositionedGlyphs = this.layoutCluster(cluster, fontSize, currentX, currentY, null)
        positionedGlyphs.splice(-clusterGlyphs.length, clusterGlyphs.length, ...repositionedGlyphs)
        
        if (repositionedGlyphs.length > 0) {
          const baseGlyph = repositionedGlyphs.find(g => g.anchorType === null || g.anchorType === undefined)
          if (baseGlyph) {
            currentX += baseGlyph.transformed.advanceWidth + this.options.letterSpacing
          } else {
            currentX += repositionedGlyphs[0].transformed.advanceWidth + this.options.letterSpacing
          }
        }
      }
    }
    
    return positionedGlyphs
  }

  /**
   * Layout a single grapheme cluster
   * @param {GraphemeCluster} cluster - Grapheme cluster
   * @param {number} fontSize - Font size in pixels
   * @param {number} x - Starting X position
   * @param {number} y - Baseline Y position
   * @param {string} previousChar - Previous character for kerning
   * @returns {Array<PositionedGlyph>} Array of positioned glyphs
   */
  layoutCluster(cluster, fontSize, x, y, previousChar) {
    const positionedGlyphs = []
    const renderingOrder = cluster.getRenderingOrder()
    
    // Find base character for anchor positioning
    const baseChar = cluster.getBaseChar()
    const baseGlyph = baseChar ? globalGlyphCache.getWithFallback(baseChar) : null
    
    // Apply kerning to base character
    let kerningAdjustment = 0
    if (this.options.kerning && previousChar && baseChar) {
      kerningAdjustment = this.kerningSystem.getKerningAdjustment(previousChar, baseChar)
    }
    
    const adjustedX = x + this.coordinateSystem.unitsToPixels(kerningAdjustment, fontSize)
    
    // Store base glyph positioned coordinates for mark attachment
    let baseGlyphTransformed = null
    
    // Layout each character in the cluster
    renderingOrder.forEach((char, index) => {
      const glyph = globalGlyphCache.getWithFallback(char)
      const isMark = cluster.getCombiningMarks().some(mark => mark.char === char)
      
      let glyphX = adjustedX
      let glyphY = y // Always start at baseline
      let anchorType = null
      
      if (isMark && baseGlyph && baseGlyphTransformed) {
        // Position mark using anchor points relative to positioned base glyph
        const markType = cluster.getCombiningMarks().find(mark => mark.char === char)?.type
        anchorType = markType
        
        const anchor = baseGlyph.getAnchor(markType)
        if (anchor) {
          // Transform anchor point relative to the positioned base glyph
          const anchorTransformed = this.coordinateSystem.transformAnchor(anchor, fontSize, baseGlyphTransformed.x, baseGlyphTransformed.y)
          
          glyphX = anchorTransformed.x - this.coordinateSystem.unitsToPixels(glyph.leftBearing, fontSize)
          glyphY = anchorTransformed.y - this.coordinateSystem.unitsToPixels(glyph.baselineOffset, fontSize)
        } else {
          // Fallback positioning - minimal and relative to baseline
          glyphX = adjustedX
          glyphY = y + this.getMarkOffset(markType, fontSize)
        }
      } else if (char === baseChar) {
        // Base character uses adjusted position
        glyphX = adjustedX
        glyphY = y // Base character always on baseline
      } else {
        // Other characters (leading vowels, etc.) - position at baseline
        glyphX = adjustedX
        glyphY = y
      }
      
      const transformed = this.coordinateSystem.transformGlyph(glyph, fontSize, glyphX, glyphY)
      
      // Store base glyph transformed position for mark attachment
      if (char === baseChar) {
        baseGlyphTransformed = transformed
      }
      
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
        return -fontSize * 0.3
      case 'bottom':
        return fontSize * 0.15
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
