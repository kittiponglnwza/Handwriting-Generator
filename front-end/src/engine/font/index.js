// Barrel export for font engine
export {
  buildGlyphMap,
  compileFontBuffer,
  buildMetadata,
  buildExportGlyphMap,
  validateSvgPath,
} from './fontBuilder.js'
export { computeGlyphMetrics, isThaiNonSpacing, getGlyphClass } from './metrics.js'
export { buildGSUB, buildGPOS, getFeatureStatus } from './thaiFeatures.js'
