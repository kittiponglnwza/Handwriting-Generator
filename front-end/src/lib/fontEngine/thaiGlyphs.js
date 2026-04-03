// thaiGlyphs.js - Thai glyph definitions with proper anchor points
// Each glyph follows OpenType conventions with anchor-based positioning

import { Glyph, globalGlyphCache } from './Glyph.js'

/**
 * Thai glyph definitions with anchor points for combining marks
 * Anchors define attachment points for marks relative to base characters
 */

// Base consonants with anchor points
const THAI_CONSONANTS = {
  'ก': {
    char: 'ก',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z',
    advanceWidth: 580,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 290, y: 600 },      // For upper marks like ่ ้ ๊ ๋
      bottom: { x: 290, y: -100 },  // For lower marks like ุ ู
      middle: { x: 290, y: 300 },    // For middle marks
    },
  },

  'ข': {
    char: 'ข',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z M 500 600 Q 550 500 600 400 Q 650 300 620 250 Q 590 200 550 250 Q 510 300 480 400 Q 450 500 500 600 Z',
    advanceWidth: 680,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 290, y: 600 },
      bottom: { x: 290, y: -100 },
      middle: { x: 290, y: 300 },
    },
  },

  'ค': {
    char: 'ค',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z M 500 400 Q 550 350 600 300 Q 650 250 620 200 Q 590 150 550 200 Q 510 250 480 300 Q 450 350 500 400 Z',
    advanceWidth: 650,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 290, y: 600 },
      bottom: { x: 290, y: -100 },
      middle: { x: 290, y: 300 },
    },
  },

  'ร': {
    char: 'ร',
    path: 'M 200 800 L 200 200 Q 200 100 300 100 Q 400 100 400 200 L 400 600 Q 400 700 500 700 Q 600 700 600 600',
    advanceWidth: 550,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 300, y: 600 },
      bottom: { x: 300, y: -100 },
      middle: { x: 300, y: 300 },
    },
  },

  'น': {
    char: 'น',
    path: 'M 200 800 L 200 200 Q 200 100 300 100 Q 400 100 400 200 L 400 800',
    advanceWidth: 500,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 300, y: 600 },
      bottom: { x: 300, y: -100 },
      middle: { x: 300, y: 300 },
    },
  },
}

// Vowels and tone marks (combining characters)
const THAI_MARKS = {
  // Tone marks (attach to top anchor)
  '่': {
    char: '่',
    path: 'M 150 650 Q 200 600 250 650 Q 300 700 350 650 M 250 650 Q 300 600 350 650',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  '้': {
    char: '้',
    path: 'M 150 650 Q 200 600 250 650 Q 300 700 350 650 M 100 650 Q 150 600 200 650 Q 250 700 300 650 M 250 650 Q 300 600 350 650',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  '๊': {
    char: '๊',
    path: 'M 150 650 Q 200 600 250 650 Q 300 700 350 650 M 250 650 Q 300 600 350 650 M 200 650 Q 250 600 300 650',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  '๋': {
    char: '๋',
    path: 'M 150 650 Q 200 600 250 650 Q 300 700 350 650 M 250 650 Q 300 600 350 650 M 200 650 Q 250 600 300 650 M 100 650 Q 150 600 200 650',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  // Upper vowels (attach to top anchor)
  'ิ': {
    char: 'ิ',
    path: 'M 200 600 Q 250 550 300 600 Q 350 650 400 600',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ี': {
    char: 'ี',
    path: 'M 200 600 Q 250 550 300 600 Q 350 650 400 600 M 150 600 Q 200 550 250 600 Q 300 650 350 600',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ึ': {
    char: 'ึ',
    path: 'M 200 550 Q 250 500 300 550 Q 350 600 400 550 M 200 650 Q 250 600 300 650 Q 350 700 400 650',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ื': {
    char: 'ื',
    path: 'M 200 550 Q 250 500 300 550 Q 350 600 400 550 M 150 550 Q 200 500 250 550 Q 300 600 350 550 M 200 650 Q 250 600 300 650 Q 350 700 400 650 M 150 650 Q 200 600 250 650 Q 300 700 350 650',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ั': {
    char: 'ั',
    path: 'M 200 500 Q 300 450 400 500 Q 500 550 600 500',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  // Lower vowels (attach to bottom anchor)
  'ุ': {
    char: 'ุ',
    path: 'M 200 100 Q 250 50 300 100 Q 350 150 400 100',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ู': {
    char: 'ู',
    path: 'M 200 100 Q 250 50 300 100 Q 350 150 400 100 M 150 100 Q 200 50 250 100 Q 300 150 350 100',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ฺ': {
    char: 'ฺ',
    path: 'M 250 50 Q 300 0 350 50',
    advanceWidth: 0,
    leftBearing: -50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {},
  },

  // Leading vowels (standalone characters)
  'เ': {
    char: 'เ',
    path: 'M 100 400 L 100 200 Q 100 100 200 100 Q 300 100 300 200 L 300 400',
    advanceWidth: 350,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 200, y: 600 },
      bottom: { x: 200, y: -100 },
      middle: { x: 200, y: 300 },
    },
  },

  'แ': {
    char: 'แ',
    path: 'M 100 400 L 100 200 Q 100 100 200 100 Q 300 100 300 200 L 300 400 M 50 300 L 350 300',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 200, y: 600 },
      bottom: { x: 200, y: -100 },
      middle: { x: 200, y: 300 },
    },
  },

  'โ': {
    char: 'โ',
    path: 'M 100 400 L 100 200 Q 100 100 200 100 Q 300 100 300 200 L 300 400 M 50 250 Q 200 150 350 250',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 200, y: 600 },
      bottom: { x: 200, y: -100 },
      middle: { x: 200, y: 300 },
    },
  },

  'ใ': {
    char: 'ใ',
    path: 'M 100 400 L 100 200 Q 100 100 200 100 Q 300 100 300 200 L 300 400 M 50 200 Q 200 100 350 200',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 200, y: 600 },
      bottom: { x: 200, y: -100 },
      middle: { x: 200, y: 300 },
    },
  },

  'ไ': {
    char: 'ไ',
    path: 'M 100 400 L 100 200 Q 100 100 200 100 Q 300 100 300 200 L 300 400 M 50 150 Q 200 50 350 150',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {
      top: { x: 200, y: 600 },
      bottom: { x: 200, y: -100 },
      middle: { x: 200, y: 300 },
    },
  },

  // Trailing vowels
  'า': {
    char: 'า',
    path: 'M 100 400 Q 200 350 300 400 Q 400 450 500 400',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {},
  },

  'ำ': {
    char: 'ำ',
    path: 'M 100 400 Q 200 350 300 400 Q 400 450 500 400 M 200 600 Q 250 550 300 600 Q 350 650 400 600',
    advanceWidth: 450,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {},
  },

  'ๅ': {
    char: 'ๅ',
    path: 'M 200 800 Q 250 600 300 400 L 350 200 Q 400 100 450 150 Q 500 200 480 300 L 450 500 Q 400 700 350 800 L 300 850 Q 250 800 200 800 Z M 300 600 Q 350 550 400 600 Q 450 650 500 600',
    advanceWidth: 600,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {},
  },

  'ฯ': {
    char: 'ฯ',
    path: 'M 200 400 Q 250 350 300 400 Q 350 450 400 400 M 100 400 Q 150 350 200 400 Q 250 450 300 400',
    advanceWidth: 400,
    leftBearing: 50,
    rightBearing: 50,
    baselineOffset: 0,
    anchors: {},
  },
}

// Additional characters
const ADDITIONAL_CHARS = {
  ' ': {
    char: ' ',
    path: '',
    advanceWidth: 300,
    leftBearing: 0,
    rightBearing: 0,
    baselineOffset: 0,
    anchors: {},
  },

  '\n': {
    char: '\n',
    path: '',
    advanceWidth: 0,
    leftBearing: 0,
    rightBearing: 0,
    baselineOffset: 0,
    anchors: {},
  },
}

// Combine all glyph definitions
const ALL_THAI_GLYPHS = {
  ...THAI_CONSONANTS,
  ...THAI_MARKS,
  ...ADDITIONAL_CHARS,
}

/**
 * Load Thai glyphs into the global cache
 */
export function loadThaiGlyphs() {
  Object.entries(ALL_THAI_GLYPHS).forEach(([char, glyphData]) => {
    globalGlyphCache.set(char, glyphData)
  })
}

/**
 * Get Thai glyph definitions
 * @returns {Object} All Thai glyph definitions
 */
export function getThaiGlyphs() {
  return ALL_THAI_GLYPHS
}

/**
 * Check if character is a Thai mark (combining character)
 * @param {string} char 
 * @returns {boolean}
 */
export function isThaiMark(char) {
  return Object.keys(THAI_MARKS).includes(char)
}

/**
 * Check if character is a Thai consonant
 * @param {string} char 
 * @returns {boolean}
 */
export function isThaiConsonant(char) {
  return Object.keys(THAI_CONSONANTS).includes(char)
}

/**
 * Get anchor type for Thai mark
 * @param {string} char 
 * @returns {string|null} 'top', 'bottom', or null
 */
export function getThaiMarkAnchorType(char) {
  const topMarks = ['่', '้', '๊', '๋', 'ิ', 'ี', 'ึ', 'ื', 'ั']
  const bottomMarks = ['ุ', 'ู', 'ฺ']
  
  if (topMarks.includes(char)) return 'top'
  if (bottomMarks.includes(char)) return 'bottom'
  return null
}

// Auto-load glyphs when module is imported
loadThaiGlyphs()
