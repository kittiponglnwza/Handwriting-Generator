// DebugRenderer.js - Visual debugging tools for font engine layout
// Shows baseline, bounding boxes, anchor points, and spacing issues

import { coordinateSystem } from './CoordinateSystem.js'

/**
 * Debug renderer for visualizing layout issues
 */
export class DebugRenderer {
  constructor(options = {}) {
    this.options = {
      showBaseline: true,
      showBoundingBoxes: true,
      showAnchorPoints: true,
      showAdvanceWidth: true,
      baselineColor: '#ff0000',
      boundingBoxColor: '#0066cc',
      anchorPointColor: '#ff6600',
      advanceWidthColor: '#00cc00',
      opacity: 0.7,
      ...options
    }
  }

  /**
   * Generate debug SVG overlay for positioned glyphs
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {string} Debug SVG overlay string
   */
  generateDebugOverlay(positionedGlyphs, fontSize) {
    if (positionedGlyphs.length === 0) return ''

    const debugElements = []
    const baselinePos = coordinateSystem.getBaselinePosition(fontSize)

    // Generate baseline
    if (this.options.showBaseline) {
      const bounds = this.calculateBounds(positionedGlyphs, fontSize)
      debugElements.push(this.generateBaseline(bounds, baselinePos))
    }

    // Generate debug elements for each glyph
    positionedGlyphs.forEach((glyph, index) => {
      const debugGroup = this.generateGlyphDebugElements(glyph, fontSize, index)
      debugElements.push(debugGroup)
    })

    return debugElements.join('\n')
  }

  /**
   * Generate baseline line
   * @param {Object} bounds - Text bounds
   * @param {number} baselinePos - Baseline position
   * @returns {string} SVG line element
   */
  generateBaseline(bounds, baselinePos) {
    return `<line x1="${bounds.x - 10}" y1="${baselinePos}" x2="${bounds.x + bounds.width + 10}" y2="${baselinePos}" 
            stroke="${this.options.baselineColor}" stroke-width="1" stroke-dasharray="5,5" opacity="${this.options.opacity}" />`
  }

  /**
   * Generate debug elements for a single glyph
   * @param {PositionedGlyph} positionedGlyph - Positioned glyph
   * @param {number} fontSize - Font size in pixels
   * @param {number} index - Glyph index
   * @returns {string} SVG group element
   */
  generateGlyphDebugElements(positionedGlyph, fontSize, index) {
    const { glyph, transformed, x, y, anchorType } = positionedGlyph
    const elements = []

    // Generate bounding box
    if (this.options.showBoundingBoxes) {
      elements.push(this.generateBoundingBox(transformed, fontSize))
    }

    // Generate advance width indicator
    if (this.options.showAdvanceWidth) {
      elements.push(this.generateAdvanceWidthIndicator(transformed, fontSize))
    }

    // Generate anchor points
    if (this.options.showAnchorPoints && glyph.hasAnchors()) {
      elements.push(this.generateAnchorPoints(glyph, transformed, fontSize))
    }

    // Generate glyph label
    elements.push(this.generateGlyphLabel(glyph, transformed, index))

    return `<g class="debug-glyph-${index}" opacity="${this.options.opacity}">
      ${elements.join('\n      ')}
    </g>`
  }

  /**
   * Generate bounding box for glyph
   * @param {Object} transformed - Transformed glyph coordinates
   * @param {number} fontSize - Font size in pixels
   * @returns {string} SVG rect element
   */
  generateBoundingBox(transformed, fontSize) {
    const { x, y, scale } = transformed
    const width = transformed.totalWidth || transformed.advanceWidth
    const height = fontSize * 0.8 // Approximate glyph height

    return `<rect x="${x}" y="${y - height * 0.8}" width="${width}" height="${height}" 
            fill="none" stroke="${this.options.boundingBoxColor}" stroke-width="1" />`
  }

  /**
   * Generate advance width indicator
   * @param {Object} transformed - Transformed glyph coordinates
   * @param {number} fontSize - Font size in pixels
   * @returns {string} SVG line elements
   */
  generateAdvanceWidthIndicator(transformed, fontSize) {
    const { x, y, advanceWidth } = transformed
    const baselinePos = y

    return `<line x1="${x}" y1="${baselinePos + 5}" x2="${x + advanceWidth}" y2="${baselinePos + 5}" 
            stroke="${this.options.advanceWidthColor}" stroke-width="2" />
            <line x1="${x + advanceWidth}" y1="${baselinePos}" x2="${x + advanceWidth}" y2="${baselinePos + 10}" 
            stroke="${this.options.advanceWidthColor}" stroke-width="2" />`
  }

  /**
   * Generate anchor points visualization
   * @param {Object} glyph - Glyph object
   * @param {Object} transformed - Transformed coordinates
   * @param {number} fontSize - Font size in pixels
   * @returns {string} SVG circle elements
   */
  generateAnchorPoints(glyph, transformed, fontSize) {
    const { x, y } = transformed
    const elements = []

    Object.entries(glyph.anchors).forEach(([anchorName, anchor]) => {
      const anchorX = x + coordinateSystem.unitsToPixels(anchor.x, fontSize)
      const anchorY = y + coordinateSystem.unitsToPixels(anchor.y, fontSize)

      elements.push(`<circle cx="${anchorX}" cy="${anchorY}" r="3" 
                      fill="${this.options.anchorPointColor}" stroke="black" stroke-width="1" />`)
      elements.push(`<text x="${anchorX + 5}" y="${anchorY - 5}" font-size="8" fill="${this.options.anchorPointColor}">
                      ${anchorName}
                    </text>`)
    })

    return elements.join('\n            ')
  }

  /**
   * Generate glyph label
   * @param {Object} glyph - Glyph object
   * @param {Object} transformed - Transformed coordinates
   * @param {number} index - Glyph index
   * @returns {string} SVG text element
   */
  generateGlyphLabel(glyph, transformed, index) {
    const { x, y } = transformed
    const label = `${glyph.char} (${index})`
    
    return `<text x="${x}" y="${y - 5}" font-size="10" fill="#333" font-family="monospace">
              ${label}
            </text>`
  }

  /**
   * Calculate bounds for all glyphs
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Bounding box
   */
  calculateBounds(positionedGlyphs, fontSize) {
    return coordinateSystem.getTextBounds(positionedGlyphs, fontSize)
  }

  /**
   * Generate spacing analysis
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Spacing analysis
   */
  analyzeSpacing(positionedGlyphs, fontSize) {
    const analysis = {
      totalGlyphs: positionedGlyphs.length,
      spacingIssues: [],
      averageSpacing: 0,
      inconsistentSpacing: false,
    }

    let totalSpacing = 0
    let spacingCount = 0
    const spacings = []

    for (let i = 1; i < positionedGlyphs.length; i++) {
      const prev = positionedGlyphs[i - 1]
      const curr = positionedGlyphs[i]
      
      // Skip marks in spacing analysis (they don't advance position)
      if (curr.anchorType !== null && curr.anchorType !== undefined) {
        continue
      }

      const spacing = curr.x - (prev.x + prev.transformed.advanceWidth)
      spacings.push(spacing)
      totalSpacing += spacing
      spacingCount++

      // Check for spacing issues
      if (Math.abs(spacing) > 10) { // More than 10px spacing is suspicious
        analysis.spacingIssues.push({
          from: prev.glyph.char,
          to: curr.glyph.char,
          spacing: spacing,
          index: i,
        })
      }
    }

    analysis.averageSpacing = spacingCount > 0 ? totalSpacing / spacingCount : 0
    
    // Check for inconsistent spacing
    if (spacings.length > 1) {
      const variance = this.calculateVariance(spacings)
      analysis.inconsistentSpacing = variance > 25 // High variance indicates inconsistency
    }

    return analysis
  }

  /**
   * Calculate variance of an array of numbers
   * @param {Array<number} values - Array of numbers
   * @returns {number} Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    
    return variance
  }

  /**
   * Generate comprehensive debug report
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Debug report
   */
  generateDebugReport(positionedGlyphs, fontSize) {
    const spacingAnalysis = this.analyzeSpacing(positionedGlyphs, fontSize)
    const bounds = this.calculateBounds(positionedGlyphs, fontSize)

    return {
      bounds,
      spacingAnalysis,
      glyphCount: positionedGlyphs.length,
      baselinePosition: coordinateSystem.getBaselinePosition(fontSize),
      issues: this.identifyIssues(positionedGlyphs, spacingAnalysis),
    }
  }

  /**
   * Identify layout issues
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {Object} spacingAnalysis - Spacing analysis
   * @returns {Array} Array of identified issues
   */
  identifyIssues(positionedGlyphs, spacingAnalysis) {
    const issues = []

    // Check for spacing issues
    if (spacingAnalysis.inconsistentSpacing) {
      issues.push({
        type: 'inconsistent_spacing',
        severity: 'high',
        description: 'Character spacing is inconsistent',
        details: spacingAnalysis.spacingIssues,
      })
    }

    // Check for baseline alignment issues
    const baselineY = coordinateSystem.getBaselinePosition(48) // Assume 48px for analysis
    const baselineVariations = positionedGlyphs.map(g => Math.abs(g.y - baselineY))
    const maxBaselineVariation = Math.max(...baselineVariations)

    if (maxBaselineVariation > 5) {
      issues.push({
        type: 'baseline_misalignment',
        severity: 'high',
        description: 'Characters are not aligned to baseline',
        details: { maxVariation: maxBaselineVariation },
      })
    }

    // Check for Thai mark positioning issues
    const thaiMarks = positionedGlyphs.filter(g => g.anchorType !== null && g.anchorType !== undefined)
    const floatingMarks = thaiMarks.filter(mark => {
      const baseGlyph = positionedGlyphs.find(g => g.anchorType === null || g.anchorType === undefined)
      return baseGlyph && Math.abs(mark.y - baseGlyph.y) > 20
    })

    if (floatingMarks.length > 0) {
      issues.push({
        type: 'floating_thai_marks',
        severity: 'high',
        description: 'Thai tone marks are not properly attached to base characters',
        details: { floatingMarks: floatingMarks.length },
      })
    }

    return issues
  }
}

/**
 * Convenience function to create debug renderer
 * @param {Object} options - Debug options
 * @returns {DebugRenderer} Debug renderer instance
 */
export function createDebugRenderer(options = {}) {
  return new DebugRenderer(options)
}

/**
 * Export singleton debug renderer
 */
export const debugRenderer = new DebugRenderer()
