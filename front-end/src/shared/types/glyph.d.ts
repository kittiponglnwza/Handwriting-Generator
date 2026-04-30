/**
 * @file glyph.d.ts
 * Type definitions for glyph data structures.
 */

/** Raw extracted glyph from VisionEngine */
export interface Glyph {
  id: string
  ch: string
  svgPath: string
  status: 'ok' | 'empty' | 'error'
  confidence?: number
  _visionStatus?: 'excellent' | 'good' | 'acceptable' | 'poor'
  preview?: string
  previewInk?: string
  viewBox?: string
}

/** Glyph with deformation variant applied */
export interface VersionedGlyph extends Glyph {
  version: 1 | 2 | 3
  verLabel: string
}

/** Result from the extraction pipeline */
export interface GlyphResult {
  glyphs: Glyph[]
  validationStatus: 'ok' | 'empty' | 'error'
}
