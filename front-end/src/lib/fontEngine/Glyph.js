// Glyph.js - Core glyph data structure for font engine
// Follows OpenType font conventions with proper metrics

/**
 * @typedef {Object} AnchorPoint
 * @property {number} x - X coordinate in font units
 * @property {number} y - Y coordinate in font units
 */

/**
 * @typedef {Object} GlyphMetrics
 * @property {string} char - Unicode character
 * @property {string} path - SVG path data
 * @property {number} advanceWidth - Horizontal advance width
 * @property {number} leftBearing - Left side bearing
 * @property {number} rightBearing - Right side bearing
 * @property {number} baselineOffset - Offset from baseline
 * @property {Object.<string, AnchorPoint>} [anchors] - Anchor points for combining marks
 * @property {number} [ascent] - Ascent override
 * @property {number} [descent] - Descent override
 */

/**
 * Core font metrics following OpenType conventions
 */
export const FONT_METRICS = {
  // Font units per em (standard)
  unitsPerEm: 1000,
  
  // Vertical metrics (relative to baseline = 0)
  baseline: 0,
  ascent: 800,      // Height above baseline for tallest characters
  descent: -200,    // Depth below baseline for descenders
  
  // Default glyph metrics
  defaultAdvanceWidth: 600,
  defaultLeftBearing: 50,
  defaultRightBearing: 50,
}

/**
 * Glyph class representing a single character in the font
 */
export class Glyph {
  /**
   * @param {GlyphMetrics} metrics 
   */
  constructor(metrics) {
    this.char = metrics.char
    this.path = metrics.path
    this.advanceWidth = metrics.advanceWidth || FONT_METRICS.defaultAdvanceWidth
    this.leftBearing = metrics.leftBearing || FONT_METRICS.defaultLeftBearing
    this.rightBearing = metrics.rightBearing || FONT_METRICS.defaultRightBearing
    this.baselineOffset = metrics.baselineOffset || 0
    this.anchors = metrics.anchors || {}
    this.ascent = metrics.ascent || FONT_METRICS.ascent
    this.descent = metrics.descent || FONT_METRICS.descent
  }

  /**
   * Get the total width of the glyph including bearings
   */
  get totalWidth() {
    return this.leftBearing + this.advanceWidth + this.rightBearing
  }

  /**
   * Get the bounding box of the glyph
   */
  getBoundingBox() {
    // For now, estimate from path - in production, parse SVG path properly
    return {
      x: 0,
      y: this.descent,
      width: this.advanceWidth,
      height: this.ascent - this.descent
    }
  }

  /**
   * Get anchor point by name
   * @param {string} anchorName 
   * @returns {AnchorPoint|null}
   */
  getAnchor(anchorName) {
    return this.anchors[anchorName] || null
  }

  /**
   * Check if glyph has anchors
   */
  hasAnchors() {
    return Object.keys(this.anchors).length > 0
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      char: this.char,
      path: this.path,
      advanceWidth: this.advanceWidth,
      leftBearing: this.leftBearing,
      rightBearing: this.rightBearing,
      baselineOffset: this.baselineOffset,
      anchors: this.anchors,
      ascent: this.ascent,
      descent: this.descent,
    }
  }

  /**
   * Create from JSON object
   * @param {Object} data 
   * @returns {Glyph}
   */
  static fromJSON(data) {
    return new Glyph(data)
  }

  /**
   * Validate glyph structure
   * @param {GlyphMetrics} metrics 
   * @returns {boolean}
   */
  static validate(metrics) {
    return (
      typeof metrics.char === 'string' &&
      typeof metrics.path === 'string' &&
      typeof metrics.advanceWidth === 'number' &&
      typeof metrics.leftBearing === 'number' &&
      typeof metrics.rightBearing === 'number' &&
      typeof metrics.baselineOffset === 'number'
    )
  }
}

/**
 * Glyph cache for performance optimization
 */
export class GlyphCache {
  constructor() {
    this.cache = new Map()
    this.loadDefaultGlyphs()
  }

  /**
   * Add a glyph to the cache
   * @param {string} char 
   * @param {Glyph|GlyphMetrics} glyph 
   */
  set(char, glyph) {
    if (glyph instanceof Glyph) {
      this.cache.set(char, glyph)
    } else if (Glyph.validate(glyph)) {
      this.cache.set(char, new Glyph(glyph))
    } else {
      throw new Error(`Invalid glyph data for character: ${char}`)
    }
  }

  /**
   * Get a glyph from the cache
   * @param {string} char 
   * @returns {Glyph|null}
   */
  get(char) {
    return this.cache.get(char) || null
  }

  /**
   * Check if glyph exists in cache
   * @param {string} char 
   * @returns {boolean}
   */
  has(char) {
    return this.cache.has(char)
  }

  /**
   * Get glyph with fallback creation
   * @param {string} char 
   * @returns {Glyph}
   */
  getWithFallback(char) {
    let glyph = this.get(char)
    if (!glyph) {
      glyph = this.createFallbackGlyph(char)
      this.set(char, glyph)
    }
    return glyph
  }

  /**
   * Create a fallback glyph for missing characters
   * @param {string} char 
   * @returns {Glyph}
   */
  createFallbackGlyph(char) {
    return new Glyph({
      char,
      path: `M 50 800 L 550 800 M 50 200 L 550 200 M 50 200 L 50 800 M 550 200 L 550 800`,
      advanceWidth: 600,
      leftBearing: 50,
      rightBearing: 50,
      baselineOffset: 0,
      anchors: {},
    })
  }

  /**
   * Load glyphs from JSON data
   * @param {Object|Array} jsonData 
   */
  loadFromJSON(jsonData) {
    const glyphs = Array.isArray(jsonData) ? jsonData : Object.values(jsonData)
    
    for (const glyphData of glyphs) {
      try {
        if (Glyph.validate(glyphData)) {
          this.set(glyphData.char, glyphData)
        }
      } catch (error) {
        console.warn(`Failed to load glyph for ${glyphData.char}:`, error.message)
      }
    }
  }

  /**
   * Export all glyphs to JSON
   * @returns {Object}
   */
  toJSON() {
    const result = {}
    for (const [char, glyph] of this.cache) {
      result[char] = glyph.toJSON()
    }
    return result
  }

  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get all characters in cache
   * @returns {string[]}
   */
  getCharacters() {
    return Array.from(this.cache.keys())
  }

  /**
   * Load default Thai glyphs
   */
  loadDefaultGlyphs() {
    // Will be populated by thaiGlyphs.js
  }
}

// Global glyph cache instance
export const globalGlyphCache = new GlyphCache()
