// index.js - Main entry point for the handwriting rendering engine
// Provides clean imports for all major functionality

// Core React components
export { default as HandwritingText, QuickHandwriting, useHandwritingEngine, HandwritingPresets } from './HandwritingText.jsx'

// Core engine and utilities
export { 
  createHandwritingEngine, 
  renderHandwritingText,
  HandwritingEngine,
  CoordinateSystem,
  GlyphLayout,
  SVGPathGenerator,
  HandwritingRNG,
} from './renderingEngine.js'

// Glyph data and cache
export { 
  glyphCache, 
  getGlyph, 
  createFallbackGlyph,
  GlyphCache,
  THAI_GLYPHS,
  FONT_METRICS,
} from './glyphData.js'

// Example components
export { default as HandwritingDemo } from './examples/HandwritingDemo.jsx'
export { BasicExample, MultilineExample, CustomStyleExample } from './examples/HandwritingDemo.jsx'

// Version info
export const VERSION = '1.0.0'

// Default export - main component
export { default } from './HandwritingText.jsx'
