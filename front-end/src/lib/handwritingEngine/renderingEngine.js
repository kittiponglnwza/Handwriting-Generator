// renderingEngine.js - Core handwriting rendering engine
// Handles coordinate system transformation, glyph positioning, and SVG generation

import { FONT_METRICS, getGlyph } from './glyphData.js'

// Random number generator for natural handwriting variation
class HandwritingRNG {
  constructor(seed = Math.random()) {
    this.seed = seed
  }
  
  // Returns a random number between 0 and 1
  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
  
  // Returns a random number between min and max
  range(min, max) {
    return min + this.random() * (max - min)
  }
  
  // Returns a random integer between min and max (inclusive)
  int(min, max) {
    return Math.floor(this.range(min, max + 1))
  }
}

// Coordinate system utilities
export class CoordinateSystem {
  constructor(scale = 1.0) {
    this.scale = scale
    this.unitsPerEm = FONT_METRICS.unitsPerEm
    this.ascent = FONT_METRICS.ascent
    this.descent = FONT_METRICS.descent
    this.baseline = FONT_METRICS.baseline
  }
  
  // Convert font units to pixels
  unitsToPixels(units) {
    return (units / this.unitsPerEm) * this.scale
  }
  
  // Get the baseline position in pixels (from top of SVG)
  getBaselineOffset(fontSize) {
    const totalHeight = this.ascent - this.descent
    const baselineRatio = this.ascent / totalHeight
    return fontSize * baselineRatio
  }
  
  // Transform glyph coordinates to SVG coordinates
  transformGlyph(glyph, fontSize, x = 0, y = 0) {
    const scale = fontSize / this.unitsPerEm
    const baselineOffset = this.getBaselineOffset(fontSize)
    
    return {
      x: x + glyph.offsetX * scale,
      y: y + baselineOffset + glyph.offsetY * scale,
      scale: scale,
      path: glyph.path,
      advanceWidth: glyph.advanceWidth * scale,
    }
  }
}

// Glyph positioning and layout
export class GlyphLayout {
  constructor(options = {}) {
    this.letterSpacing = options.letterSpacing || 0
    this.scale = options.scale || 1.0
    this.coordSystem = new CoordinateSystem(this.scale)
    this.rng = new HandwritingRNG(options.seed)
  }
  
  // Calculate positions for a sequence of glyphs
  layoutGlyphs(text, fontSize, maxWidth = Infinity) {
    const glyphs = []
    let currentX = 0
    let currentY = 0
    let lineIndex = 0
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const glyph = getGlyph(char)
      
      // Handle newline
      if (char === '\n') {
        currentX = 0
        currentY += fontSize * 1.2 // Default line height
        lineIndex++
        continue
      }
      
      // Handle space
      if (char === ' ') {
        currentX += glyph.advanceWidth + this.letterSpacing
        continue
      }
      
      // Check if we need to wrap to next line
      const glyphWidth = glyph.advanceWidth
      if (currentX + glyphWidth > maxWidth && maxWidth !== Infinity) {
        currentX = 0
        currentY += fontSize * 1.2
        lineIndex++
      }
      
      // Transform glyph to SVG coordinates
      const transformed = this.coordSystem.transformGlyph(glyph, fontSize, currentX, currentY)
      
      // Add natural handwriting variation
      const variation = this.addNaturalVariation(transformed, i)
      
      glyphs.push({
        char,
        glyph,
        transformed,
        variation,
        x: currentX,
        y: currentY,
        lineIndex,
      })
      
      // Advance to next position
      currentX += glyphWidth + this.letterSpacing
    }
    
    return glyphs
  }
  
  // Add natural handwriting variation to a glyph
  addNaturalVariation(transformed, index) {
    // Slight random offset (±1-2px)
    const offsetX = this.rng.range(-2, 2)
    const offsetY = this.rng.range(-2, 2)
    
    // Slight rotation (±1 degree)
    const rotation = this.rng.range(-1, 1)
    
    // Slight scale variation (±2%)
    const scaleVariation = this.rng.range(0.98, 1.02)
    
    return {
      x: transformed.x + offsetX,
      y: transformed.y + offsetY,
      rotation,
      scale: transformed.scale * scaleVariation,
    }
  }
}

// SVG path generation
export class SVGPathGenerator {
  static generateGlyphPath(glyphData, variation = {}) {
    const { x, y, scale, path } = glyphData
    const { rotation = 0, scale: variationScale = 1 } = variation
    
    const finalScale = scale * variationScale
    const transform = `translate(${x}, ${y}) scale(${finalScale}) rotate(${rotation})`
    
    return {
      d: path,
      transform,
    }
  }
  
  static generateSVG(glyphs, options = {}) {
    const {
      width = 800,
      height = 600,
      strokeColor = '#2C2416',
      strokeWidth = 2,
      fillColor = 'none',
      className = 'handwriting-text',
    } = options
    
    // Calculate SVG dimensions based on content
    const bounds = this.calculateBounds(glyphs)
    const svgWidth = width || bounds.width + 40
    const svgHeight = height || bounds.height + 40
    
    // Generate SVG elements
    const paths = glyphs.map(({ glyph, transformed, variation }) => {
      const pathData = this.generateGlyphPath(transformed, variation)
      return `<path d="${pathData.d}" transform="${pathData.transform}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" stroke-linecap="round" stroke-linejoin="round" />`
    }).join('\n    ')
    
    return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="${className}" xmlns="http://www.w3.org/2000/svg">
  <g>
    ${paths}
  </g>
</svg>`
  }
  
  static calculateBounds(glyphs) {
    if (glyphs.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    glyphs.forEach(({ transformed, variation }) => {
      const x = variation.x || transformed.x
      const y = variation.y || transformed.y
      const scale = (variation.scale || transformed.scale) * 100 // Rough estimate
      
      minX = Math.min(minX, x - scale)
      minY = Math.min(minY, y - scale)
      maxX = Math.max(maxX, x + transformed.advanceWidth + scale)
      maxY = Math.max(maxY, y + scale)
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}

// Main rendering engine class
export class HandwritingEngine {
  constructor(options = {}) {
    this.options = {
      letterSpacing: 0,
      lineHeight: 1.2,
      scale: 1.0,
      strokeColor: '#2C2416',
      strokeWidth: 2,
      fillColor: 'none',
      seed: Math.random(),
      maxWidth: Infinity,
      ...options,
    }
    
    this.layout = new GlyphLayout(this.options)
  }
  
  // Render text to SVG string
  renderToSVG(text, fontSize = 48) {
    const glyphs = this.layout.layoutGlyphs(text, fontSize, this.options.maxWidth)
    return SVGPathGenerator.generateSVG(glyphs, {
      strokeColor: this.options.strokeColor,
      strokeWidth: this.options.strokeWidth,
      fillColor: this.options.fillColor,
    })
  }
  
  // Render text to React JSX element
  renderToJSX(text, fontSize = 48) {
    const glyphs = this.layout.layoutGlyphs(text, fontSize, this.options.maxWidth)
    const bounds = SVGPathGenerator.calculateBounds(glyphs)
    
    return (
      <svg 
        width={bounds.width + 40} 
        height={bounds.height + 40} 
        viewBox={`0 0 ${bounds.width + 40} ${bounds.height + 40}`}
        className="handwriting-text"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {glyphs.map(({ glyph, transformed, variation }, index) => {
            const pathData = SVGPathGenerator.generateGlyphPath(transformed, variation)
            return (
              <path
                key={index}
                d={pathData.d}
                transform={pathData.transform}
                stroke={this.options.strokeColor}
                strokeWidth={this.options.strokeWidth}
                fill={this.options.fillColor}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}
        </g>
      </svg>
    )
  }
  
  // Update engine options
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    this.layout = new GlyphLayout(this.options)
  }
}

// Factory function for easy engine creation
export function createHandwritingEngine(options = {}) {
  return new HandwritingEngine(options)
}

// Utility function for quick rendering
export function renderHandwritingText(text, fontSize = 48, options = {}) {
  const engine = createHandwritingEngine(options)
  return engine.renderToSVG(text, fontSize)
}
