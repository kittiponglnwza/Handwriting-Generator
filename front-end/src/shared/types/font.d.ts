/**
 * @file font.d.ts
 * Type definitions for font compilation and export.
 */

export interface FontStyle {
  roughness: number   // 0–100
  neatness: number    // 0–100
  slant: number       // -30 to 30 (degrees)
  boldness: number    // 70–150 (%)
  randomness: number  // 0–100
}

export type ExportFormat = 'ttf' | 'woff' | 'woff2' | 'otf'

export interface BuildResult {
  ttfBuffer: ArrayBuffer
  woffBuffer: ArrayBuffer
  glyphCount: number
  skipped: Array<{ ch: string; reason: string }>
  featureStatus: Record<string, { enabled: boolean; real: boolean }>
  puaMap: Map<string, number>
}
