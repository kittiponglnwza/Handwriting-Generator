// index.js - Main entry point for the production-grade font engine
// Provides clean imports for all major functionality

// Core React components
export { default as FontEngine, QuickFontEngine, useFontEngine, FONT_ENGINE_PRESETS } from './FontEngine.jsx'

// Core engine classes
export { 
  LayoutEngine,
  KerningSystem,
  PositionedGlyph,
  layoutEngine,
} from './LayoutEngine.js'

// Glyph system
export { 
  Glyph,
  GlyphCache,
  globalGlyphCache,
  FONT_METRICS,
} from './Glyph.js'

// Coordinate system
export { 
  CoordinateSystem,
  coordinateSystem,
} from './CoordinateSystem.js'

// Grapheme cluster parsing
export { 
  GraphemeCluster,
  GraphemeClusterParser,
  parseGraphemeClusters,
  parseGraphemeClustersWithMetadata,
  graphemeParser,
} from './GraphemeCluster.js'

// Handwriting variation
export { 
  HandwritingVariation,
  SeededRNG,
  VARIATION_PRESETS,
  VariationCache,
  createHandwritingVariation,
  handwritingVariation,
} from './HandwritingVariation.js'

// SVG rendering
export { 
  SVGRenderer,
  SVGPathGenerator,
  DEFAULT_SVG_OPTIONS,
  renderToSVG,
  renderToJSX,
  svgRenderer,
} from './SVGRenderer.js'

// Debug tools
export { 
  DebugRenderer,
  createDebugRenderer,
  debugRenderer,
} from './DebugRenderer.js'

// Thai glyphs and utilities
export { 
  loadThaiGlyphs,
  getThaiGlyphs,
  isThaiMark,
  isThaiConsonant,
  getThaiMarkAnchorType,
} from './thaiGlyphs.js'

// Example components
export { default as FontEngineDemo } from './examples/FontEngineDemo.jsx'
export { default as FontEngineDebugDemo } from './examples/FontEngineDebugDemo.jsx'
export { 
  BasicExample,
  ThaiComplexExample,
  MultilineExample,
  CustomStyleExample,
} from './examples/FontEngineDemo.jsx'

export {
  SpacingTest,
  ThaiMarkTest,
  BaselineTest,
  WordSpacingTest,
} from './examples/FontEngineDebugDemo.jsx'

// Version info
export const VERSION = '2.1.0'

// Default export - main component
export { default } from './FontEngine.jsx'
