// SVGRenderer.js - SVG rendering system for font engine
// Generates optimized SVG output with proper styling and accessibility

/**
 * SVG rendering options
 */
export const DEFAULT_SVG_OPTIONS = {
  strokeColor: '#2C2416',
  strokeWidth: 2,
  fillColor: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'handwriting-text',
  ariaLabel: true,
  optimizePaths: true,
}

/**
 * SVG path generator and optimizer
 */
export class SVGPathGenerator {
  /**
   * Generate SVG path element for a positioned glyph
   * @param {PositionedGlyph} positionedGlyph - Positioned glyph
   * @param {Object} options - Rendering options
   * @returns {string} SVG path element string
   */
  generatePathElement(positionedGlyph, options = {}) {
    const opts = { ...DEFAULT_SVG_OPTIONS, ...options }
    const { glyph, variation } = positionedGlyph
    const transform = positionedGlyph.getTransform()
    
    // Apply stroke width variation
    const strokeWidth = opts.strokeWidth * (variation.strokeWidth || 1)
    
    // Build path element attributes
    const attributes = {
      d: glyph.path,
      transform: transform,
      stroke: opts.strokeColor,
      'stroke-width': strokeWidth,
      fill: opts.fillColor,
      'stroke-linecap': opts.strokeLinecap,
      'stroke-linejoin': opts.strokeLinejoin,
    }
    
    // Add accessibility attributes
    if (opts.ariaLabel) {
      attributes['aria-label'] = glyph.char
      attributes.role = 'img'
    }
    
    // Add CSS class
    if (opts.className) {
      attributes.class = opts.className
    }
    
    // Generate attribute string
    const attributeString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${this.escapeAttributeValue(value)}"`)
      .join(' ')
    
    return `<path ${attributeString} />`
  }

  /**
   * Escape SVG attribute values
   * @param {string} value - Attribute value
   * @returns {string} Escaped value
   */
  escapeAttributeValue(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Optimize SVG path data
   * @param {string} pathData - SVG path data
   * @returns {string} Optimized path data
   */
  optimizePath(pathData) {
    if (!pathData) return pathData
    
    // Remove unnecessary whitespace
    let optimized = pathData
      .replace(/\s+/g, ' ')
      .replace(/([MLHVCSQTAZmlhvcsqtaz])\s+/g, '$1')
      .replace(/([MLHVCSQTAZmlhvcsqtaz])\s+([+-]?\d*\.?\d+)/g, '$1$2')
      .replace(/([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/g, '$1,$2')
      .trim()
    
    return optimized
  }

  /**
   * Generate SVG group element for multiple glyphs
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {Object} options - Rendering options
   * @returns {string} SVG group element string
   */
  generateGroupElement(positionedGlyphs, options = {}) {
    const opts = { ...DEFAULT_SVG_OPTIONS, ...options }
    
    const pathElements = positionedGlyphs.map(glyph => {
      let pathData = glyph.glyph.path
      if (opts.optimizePaths) {
        pathData = this.optimizePath(pathData)
      }
      
      const glyphWithOptions = {
        ...glyph,
        glyph: { ...glyph.glyph, path: pathData }
      }
      
      return this.generatePathElement(glyphWithOptions, opts)
    }).join('\n    ')
    
    return `<g>
    ${pathElements}
  </g>`
  }
}

/**
 * SVG renderer class
 */
export class SVGRenderer {
  constructor(options = {}) {
    this.options = { ...DEFAULT_SVG_OPTIONS, ...options }
    this.pathGenerator = new SVGPathGenerator()
  }

  /**
   * Render positioned glyphs to complete SVG string
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @param {Object} svgOptions - SVG-specific options
   * @returns {string} Complete SVG string
   */
  renderToSVG(positionedGlyphs, fontSize, svgOptions = {}) {
    if (positionedGlyphs.length === 0) {
      return this.generateEmptySVG()
    }
    
    const opts = { ...this.options, ...svgOptions }
    
    // Calculate SVG dimensions and viewBox
    const bounds = this.calculateBounds(positionedGlyphs, fontSize)
    const padding = opts.padding || 20
    const width = bounds.width + padding * 2
    const height = bounds.height + padding * 2
    const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`
    
    // Generate SVG content
    const groupElement = this.pathGenerator.generateGroupElement(positionedGlyphs, opts)
    
    // Build complete SVG
    const svgAttributes = {
      width: width,
      height: height,
      viewBox: viewBox,
      xmlns: 'http://www.w3.org/2000/svg',
      class: opts.className,
      'aria-label': opts.ariaLabel ? 'Handwriting text' : undefined,
    }
    
    const attributeString = Object.entries(svgAttributes)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}="${this.pathGenerator.escapeAttributeValue(value)}"`)
      .join(' ')
    
    return `<svg ${attributeString}>
  ${groupElement}
</svg>`
  }

  /**
   * Render positioned glyphs to JSX elements
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @param {Object} jsxOptions - JSX-specific options
   * @returns {Object} JSX element structure
   */
  renderToJSX(positionedGlyphs, fontSize, jsxOptions = {}) {
    if (positionedGlyphs.length === 0) {
      return null
    }
    
    const opts = { ...this.options, ...jsxOptions }
    
    // Calculate SVG dimensions
    const bounds = this.calculateBounds(positionedGlyphs, fontSize)
    const padding = opts.padding || 20
    const width = bounds.width + padding * 2
    const height = bounds.height + padding * 2
    const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`
    
    // Generate path elements
    const pathElements = positionedGlyphs.map((glyph, index) => {
      const { variation } = glyph
      const strokeWidth = opts.strokeWidth * (variation.strokeWidth || 1)
      
      return {
        key: `${glyph.glyph.char}-${index}`,
        d: opts.optimizePaths ? this.pathGenerator.optimizePath(glyph.glyph.path) : glyph.glyph.path,
        transform: glyph.getTransform(),
        stroke: opts.strokeColor,
        strokeWidth: strokeWidth,
        fill: opts.fillColor,
        strokeLinecap: opts.strokeLinecap,
        strokeLinejoin: opts.strokeLinejoin,
        'aria-label': opts.ariaLabel ? glyph.glyph.char : undefined,
        role: opts.ariaLabel ? 'img' : undefined,
        className: opts.className,
      }
    })
    
    return {
      type: 'svg',
      props: {
        width: width,
        height: height,
        viewBox: viewBox,
        xmlns: 'http://www.w3.org/2000/svg',
        className: opts.className,
        'aria-label': opts.ariaLabel ? 'Handwriting text' : undefined,
      },
      children: [{
        type: 'g',
        props: {},
        children: pathElements.map(pathProps => ({
          type: 'path',
          props: pathProps
        }))
      }]
    }
  }

  /**
   * Calculate bounds for positioned glyphs
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @param {number} fontSize - Font size in pixels
   * @returns {Object} Bounding box {x, y, width, height}
   */
  calculateBounds(positionedGlyphs, fontSize) {
    if (positionedGlyphs.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    positionedGlyphs.forEach(glyph => {
      const { x, y, transformed } = glyph
      const { totalWidth } = transformed
      
      // Estimate glyph bounds
      const glyphHeight = fontSize * 0.8 // Approximate height
      const glyphTop = y - glyphHeight * 0.8
      const glyphBottom = y + glyphHeight * 0.2
      
      minX = Math.min(minX, x)
      minY = Math.min(minY, glyphTop)
      maxX = Math.max(maxX, x + totalWidth)
      maxY = Math.max(maxY, glyphBottom)
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * Generate empty SVG
   * @returns {string} Empty SVG string
   */
  generateEmptySVG() {
    return '<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"></svg>'
  }

  /**
   * Update rendering options
   * @param {Object} newOptions - New rendering options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
  }
}

/**
 * Convenience function to render glyphs to SVG
 * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
 * @param {number} fontSize - Font size in pixels
 * @param {Object} options - Rendering options
 * @returns {string} SVG string
 */
export function renderToSVG(positionedGlyphs, fontSize, options = {}) {
  const renderer = new SVGRenderer(options)
  return renderer.renderToSVG(positionedGlyphs, fontSize, options)
}

/**
 * Convenience function to render glyphs to JSX
 * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
 * @param {number} fontSize - Font size in pixels
 * @param {Object} options - Rendering options
 * @returns {Object} JSX element structure
 */
export function renderToJSX(positionedGlyphs, fontSize, options = {}) {
  const renderer = new SVGRenderer(options)
  return renderer.renderToJSX(positionedGlyphs, fontSize, options)
}

/**
 * Export singleton renderer instance
 */
export const svgRenderer = new SVGRenderer()
