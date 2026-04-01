import { BaseContract } from './BaseContract.js'

export const GlyphExtractionContract = new BaseContract(
  'GlyphExtraction',
  '1.0.0',
  {
    // Input Schema
    pageWidth: { type: 'number', required: true },
    pageHeight: { type: 'number', required: true },
    chars: { 
      type: 'array', 
      required: true,
      validator: (arr) => arr.length > 0 && arr.every(ch => typeof ch === 'string')
    },
    calibration: {
      type: 'object',
      required: false,
      validator: (obj) => obj && typeof obj.offsetX === 'number' && typeof obj.offsetY === 'number'
    },
    ctx: {
      type: 'object',
      required: true,
      validator: (obj) => obj && typeof obj.getImageData === 'function'
    }
  },
  {
    // Output Schema
    glyphs: {
      type: 'array',
      required: true,
      validator: (arr) => arr.every(glyph => 
        glyph.id && glyph.status && glyph.preview
      )
    },
    geometry: {
      type: 'object',
      required: true,
      validator: (obj) => obj.cellWidth && obj.cellHeight && obj.gap
    }
  },
  {
    // Validation Rules
    'glyph_count_must_match_chars': (input, output) => {
      return output.glyphs.length === input.chars.length
    },
    'geometry_must_be_valid': (input, output) => {
      return output.geometry.cellWidth > 0 && output.geometry.cellHeight > 0
    },
    'all_glyphs_must_have_status': (input, output) => {
      return output.glyphs.every(g => ['ok', 'missing', 'overflow'].includes(g.status))
    }
  }
)
