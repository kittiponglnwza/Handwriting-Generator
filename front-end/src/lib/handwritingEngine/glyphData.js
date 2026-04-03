// glyphData.js - Core glyph definitions for handwriting rendering engine
// Each glyph follows a consistent coordinate system with baseline, ascent, and descent

// Font metrics constants
export const FONT_METRICS = {
  // Base units for coordinate system (1000 units per em is standard)
  unitsPerEm: 1000,
  
  // Vertical metrics (relative to baseline)
  ascent: 800,      // Height above baseline for tallest characters
  descent: -200,    // Depth below baseline for descenders
  baseline: 0,      // Baseline position
  
  // Default glyph dimensions
  defaultAdvanceWidth: 600,
  defaultHeight: 1000,
}

// Example Thai glyphs with SVG paths
// These are simplified paths for demonstration - in production, these would be
// extracted from actual handwriting samples or font files
export const THAI_GLYPHS = {
  'ก': {
    char: 'ก',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z',
    advanceWidth: 580,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  'ข': {
    char: 'ข',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z M 500 600 Q 550 500 600 400 Q 650 300 620 250 Q 590 200 550 250 Q 510 300 480 400 Q 450 500 500 600 Z',
    advanceWidth: 680,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  'ค': {
    char: 'ค',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z M 500 400 Q 550 350 600 300 Q 650 250 620 200 Q 590 150 550 200 Q 510 250 480 300 Q 450 350 500 400 Z',
    advanceWidth: 650,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  // Vowels and tone marks
  'า': {
    char: 'า',
    path: 'M 100 400 Q 200 350 300 400 Q 400 450 500 400 Q 600 350 700 400',
    advanceWidth: 400,
    offsetX: 0,
    offsetY: 0,
    ascent: 400,
    descent: 0,
  },
  
  'ิ': {
    char: 'ิ',
    path: 'M 200 600 Q 250 550 300 600 Q 350 650 400 600',
    advanceWidth: 0,
    offsetX: 0,
    offsetY: -200,
    ascent: 600,
    descent: 0,
  },
  
  '้': {
    char: '้',
    path: 'M 150 650 Q 200 600 250 650 Q 300 700 350 650 M 250 650 Q 300 600 350 650',
    advanceWidth: 0,
    offsetX: 0,
    offsetY: -250,
    ascent: 650,
    descent: 0,
  },
  
  // Basic Latin characters for testing
  'A': {
    char: 'A',
    path: 'M 300 800 L 500 200 L 700 800 M 400 600 L 600 600',
    advanceWidth: 700,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  'B': {
    char: 'B',
    path: 'M 300 200 L 300 800 M 300 200 Q 500 200 500 350 Q 500 500 300 500 M 300 500 Q 500 500 500 650 Q 500 800 300 800',
    advanceWidth: 600,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  'C': {
    char: 'C',
    path: 'M 600 300 Q 500 200 350 200 Q 200 200 200 400 Q 200 600 350 600 Q 500 600 600 500',
    advanceWidth: 650,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  },
  
  // Space character
  ' ': {
    char: ' ',
    path: '',
    advanceWidth: 300,
    offsetX: 0,
    offsetY: 0,
    ascent: 0,
    descent: 0,
  },
}

// Glyph cache for performance optimization
export class GlyphCache {
  constructor() {
    this.cache = new Map()
    this.loadDefaultGlyphs()
  }
  
  loadDefaultGlyphs() {
    Object.entries(THAI_GLYPHS).forEach(([char, glyph]) => {
      this.cache.set(char, glyph)
    })
  }
  
  get(char) {
    return this.cache.get(char)
  }
  
  set(char, glyph) {
    this.cache.set(char, glyph)
  }
  
  has(char) {
    return this.cache.has(char)
  }
  
  // Load glyphs from JSON data
  loadFromJSON(jsonData) {
    try {
      const glyphs = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      Object.entries(glyphs).forEach(([char, glyph]) => {
        // Validate glyph structure
        if (this.validateGlyph(glyph)) {
          this.set(char, glyph)
        }
      })
      return true
    } catch (error) {
      console.error('Failed to load glyphs from JSON:', error)
      return false
    }
  }
  
  validateGlyph(glyph) {
    return (
      glyph &&
      typeof glyph.char === 'string' &&
      typeof glyph.path === 'string' &&
      typeof glyph.advanceWidth === 'number' &&
      typeof glyph.offsetX === 'number' &&
      typeof glyph.offsetY === 'number'
    )
  }
  
  getAllGlyphs() {
    return Object.fromEntries(this.cache)
  }
}

// Global glyph cache instance
export const glyphCache = new GlyphCache()

// Utility function to create a fallback glyph for missing characters
export function createFallbackGlyph(char) {
  return {
    char,
    path: `M 200 800 L 800 800 M 200 200 L 800 200`, // Simple box outline
    advanceWidth: 600,
    offsetX: 0,
    offsetY: 0,
    ascent: 800,
    descent: 0,
  }
}

// Utility function to get glyph with fallback
export function getGlyph(char) {
  const glyph = glyphCache.get(char)
  if (!glyph) {
    const fallback = createFallbackGlyph(char)
    glyphCache.set(char, fallback)
    return fallback
  }
  return glyph
}
