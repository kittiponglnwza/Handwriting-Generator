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
//
// COORDINATE GUIDE for marks:
// Base glyphs occupy roughly y=100 (top) to y=850 (bottom) in font units.
// transformGlyph places them at screen: translate(x, lineY + fontSize*0.8) scale(fontSize/1000)
// So a font unit y=100 → screen ≈ lineY + 43px (at fontSize=48) — that is the top of the base char.
// A font unit y=850 → screen ≈ lineY + 79px — that is the bottom of the base char.
//
// UPPER marks (่ ้ ๊ ๋ ิ ี ึ ื ั) must appear ABOVE the base top (y=100).
//   Target screen position: lineY + 20 to lineY + 38 (just above the char top).
//   Required font y: around -300 to -100  (negative = above the ascender line).
//
// LOWER marks (ุ ู ฺ) must appear BELOW the base bottom (y=850).
//   Target screen position: lineY + 85 to lineY + 100.
//   Required font y: around 950 to 1100.
//
// getMarkOffset is set to 0 for both — NO magic pixel nudging needed once paths are correct.

const THAI_MARKS = {
  // Tone marks — single wave above the character
  '่': {
    char: '่',
    path: 'M 150 -300 Q 200 -350 250 -300 Q 300 -250 350 -300 M 250 -300 Q 300 -350 350 -300',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  '้': {
    char: '้',
    path: 'M 150 -300 Q 200 -350 250 -300 Q 300 -250 350 -300 M 100 -300 Q 150 -350 200 -300 Q 250 -250 300 -300 M 250 -300 Q 300 -350 350 -300',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  '๊': {
    char: '๊',
    path: 'M 150 -300 Q 200 -350 250 -300 Q 300 -250 350 -300 M 250 -300 Q 300 -350 350 -300 M 200 -300 Q 250 -350 300 -300',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  '๋': {
    char: '๋',
    path: 'M 150 -300 Q 200 -350 250 -300 Q 300 -250 350 -300 M 250 -300 Q 300 -350 350 -300 M 200 -300 Q 250 -350 300 -300 M 100 -300 Q 150 -350 200 -300',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  // Upper vowels — sit just above the top of the base character
  'ิ': {
    char: 'ิ',
    path: 'M 200 -200 Q 250 -250 300 -200 Q 350 -150 400 -200',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ี': {
    char: 'ี',
    path: 'M 200 -200 Q 250 -250 300 -200 Q 350 -150 400 -200 M 150 -200 Q 200 -250 250 -200 Q 300 -150 350 -200',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ึ': {
    char: 'ึ',
    path: 'M 200 -250 Q 250 -300 300 -250 Q 350 -200 400 -250 M 200 -150 Q 250 -200 300 -150 Q 350 -100 400 -150',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ื': {
    char: 'ื',
    path: 'M 200 -250 Q 250 -300 300 -250 Q 350 -200 400 -250 M 150 -250 Q 200 -300 250 -250 Q 300 -200 350 -250 M 200 -150 Q 250 -200 300 -150 Q 350 -100 400 -150 M 150 -150 Q 200 -200 250 -150 Q 300 -100 350 -150',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ั': {
    char: 'ั',
    path: 'M 200 -200 Q 300 -250 400 -200 Q 500 -150 600 -200',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  // Lower vowels — sit just below the bottom of the base character (y=850+)
  'ุ': {
    char: 'ุ',
    path: 'M 200 950 Q 250 900 300 950 Q 350 1000 400 950',
    advanceWidth: 0,
    leftBearing: -100,
    rightBearing: 100,
    baselineOffset: 0,
    anchors: {},
  },

  'ู': {
    char: 'ู',
    path: 'M 200 950 Q 250 900 300 950 Q 350 1000 400 950 M 150 950 Q 200 900 250 950 Q 300 1000 350 950',
    advanceWidth: 0,
    leftBearing: -150,
    rightBearing: 150,
    baselineOffset: 0,
    anchors: {},
  },

  'ฺ': {
    char: 'ฺ',
    path: 'M 250 900 Q 300 850 350 900',
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