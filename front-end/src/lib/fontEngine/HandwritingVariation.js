// HandwritingVariation.js - Seeded randomness for natural handwriting variation
// Provides consistent, realistic variation that remains stable across re-renders

/**
 * Seeded random number generator
 * Uses a modified xorshift algorithm for consistent results
 */
export class SeededRNG {
  /**
   * @param {number|string} seed - Seed value (number or string)
   */
  constructor(seed = Math.random()) {
    if (typeof seed === 'string') {
      // Convert string to number hash
      this.seed = this.hashString(seed)
    } else {
      this.seed = seed
    }
    
    // Ensure seed is a positive integer
    this.seed = Math.abs(Math.floor(this.seed)) || 1
  }

  /**
   * Hash string to number
   * @param {string} str - Input string
   * @returns {number} Hashed number
   */
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate next random number
   * @returns {number} Random number between 0 and 1
   */
  random() {
    // xorshift* algorithm
    this.seed ^= this.seed << 13
    this.seed ^= this.seed >> 17
    this.seed ^= this.seed << 5
    
    // Convert to 0-1 range
    return (this.seed >>> 0) / 0xFFFFFFFF
  }

  /**
   * Generate random number in range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number in range
   */
  range(min, max) {
    return min + this.random() * (max - min)
  }

  /**
   * Generate random integer in range (inclusive)
   * @param {number} min - Minimum integer
   * @param {number} max - Maximum integer
   * @returns {number} Random integer
   */
  int(min, max) {
    return Math.floor(this.range(min, max + 1))
  }

  /**
   * Generate random boolean with probability
   * @param {number} probability - Probability of true (0-1)
   * @returns {boolean} Random boolean
   */
  bool(probability = 0.5) {
    return this.random() < probability
  }

  /**
   * Choose random item from array
   * @param {Array} array - Array to choose from
   * @returns {*} Random item
   */
  choice(array) {
    return array[Math.floor(this.random() * array.length)]
  }

  /**
   * Create new RNG with derived seed
   * @param {string} salt - Salt for seed derivation
   * @returns {SeededRNG} New RNG instance
   */
  derive(salt) {
    const newSeed = this.hashString(`${this.seed}-${salt}`)
    return new SeededRNG(newSeed)
  }
}

/**
 * Handwriting variation parameters
 */
export const VARIATION_PRESETS = {
  // Subtle variation for formal writing
  subtle: {
    rotationRange: 0.5,        // ±0.5 degrees
    positionRange: 0.5,       // ±0.5 pixels
    scaleRange: 0.02,         // ±2% scale
    strokeWidthRange: 0.05,   // ±5% stroke width
  },

  // Natural variation for everyday writing
  natural: {
    rotationRange: 1.0,        // ±1 degree
    positionRange: 1.0,       // ±1 pixel
    scaleRange: 0.03,         // ±3% scale
    strokeWidthRange: 0.08,   // ±8% stroke width
  },

  // Expressive variation for artistic writing
  expressive: {
    rotationRange: 2.0,        // ±2 degrees
    positionRange: 2.0,       // ±2 pixels
    scaleRange: 0.05,         // ±5% scale
    strokeWidthRange: 0.12,   // ±12% stroke width
  },

  // Minimal variation for technical writing
  minimal: {
    rotationRange: 0.2,        // ±0.2 degrees
    positionRange: 0.2,       // ±0.2 pixels
    scaleRange: 0.01,         // ±1% scale
    strokeWidthRange: 0.02,   // ±2% stroke width
  },
}

/**
 * Handwriting variation engine
 */
export class HandwritingVariation {
  constructor(options = {}) {
    this.options = {
      preset: 'natural',
      seed: Math.random(),
      enabled: true,
      ...options
    }
    
    this.rng = new SeededRNG(this.options.seed)
    this.preset = VARIATION_PRESETS[this.options.preset] || VARIATION_PRESETS.natural
  }

  /**
   * Generate variation for a specific character instance
   * @param {string} char - Character
   * @param {number} index - Character index in text
   * @param {number} clusterIndex - Cluster index
   * @returns {Object} Variation object
   */
  generateVariation(char, index = 0, clusterIndex = 0) {
    if (!this.options.enabled) {
      return {
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        strokeWidth: 1,
      }
    }

    // Create character-specific RNG for consistent variation
    const charRNG = this.rng.derive(`${char}-${index}-${clusterIndex}`)
    
    // CRITICAL FIX: Generate variations based on preset
    const rotation = charRNG.range(-this.preset.rotationRange, this.preset.rotationRange)
    const offsetX = charRNG.range(-this.preset.positionRange, this.preset.positionRange)
    const offsetY = charRNG.range(-this.preset.positionRange, this.preset.positionRange)
    const scale = 1 + charRNG.range(-this.preset.scaleRange, this.preset.scaleRange)
    const strokeWidth = 1 + charRNG.range(-this.preset.strokeWidthRange, this.preset.strokeWidthRange)

    return {
      rotation,
      offsetX,
      offsetY,
      scale,
      strokeWidth,
    }
  }

  /**
   * Apply variation to a positioned glyph
   * @param {PositionedGlyph} positionedGlyph - Positioned glyph
   * @param {number} index - Character index
   * @param {number} clusterIndex - Cluster index
   * @returns {PositionedGlyph} Glyph with applied variation
   */
  applyVariation(positionedGlyph, index = 0, clusterIndex = 0) {
    const variation = this.generateVariation(
      positionedGlyph.glyph.char,
      index,
      clusterIndex
    )
    
    // Create new positioned glyph with variation
    const variedGlyph = new PositionedGlyph(
      positionedGlyph.glyph,
      positionedGlyph.x,
      positionedGlyph.y,
      positionedGlyph.transformed,
      variation,
      positionedGlyph.clusterIndex,
      positionedGlyph.anchorType
    )
    
    return variedGlyph
  }

  /**
   * Apply variation to array of positioned glyphs
   * @param {Array<PositionedGlyph>} positionedGlyphs - Array of positioned glyphs
   * @returns {Array<PositionedGlyph>} Array with variation applied
   */
  applyVariationToGlyphs(positionedGlyphs) {
    let charIndex = 0
    let clusterIndex = 0
    let lastClusterIndex = -1
    
    return positionedGlyphs.map((glyph, index) => {
      // Track cluster boundaries
      if (glyph.clusterIndex === 0 && lastClusterIndex !== 0) {
        clusterIndex++
      }
      lastClusterIndex = glyph.clusterIndex
      
      const variedGlyph = this.applyVariation(glyph, charIndex, clusterIndex)
      charIndex++
      
      return variedGlyph
    })
  }

  /**
   * Update variation options
   * @param {Object} newOptions - New options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    
    if (newOptions.preset) {
      this.preset = VARIATION_PRESETS[newOptions.preset] || VARIATION_PRESETS.natural
    }
    
    if (newOptions.seed !== undefined) {
      this.rng = new SeededRNG(newOptions.seed)
    }
  }

  /**
   * Get current preset
   * @returns {Object} Current preset
   */
  getPreset() {
    return this.preset
  }

  /**
   * Get all available presets
   * @returns {Object} All presets
   */
  getAvailablePresets() {
    return VARIATION_PRESETS
  }
}

/**
 * Variation cache for performance optimization
 */
export class VariationCache {
  constructor(maxSize = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  /**
   * Generate cache key
   * @param {string} char - Character
   * @param {number} index - Character index
   * @param {number} clusterIndex - Cluster index
   * @param {number} seed - RNG seed
   * @returns {string} Cache key
   */
  generateKey(char, index, clusterIndex, seed) {
    return `${char}-${index}-${clusterIndex}-${seed}`
  }

  /**
   * Get variation from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached variation or null
   */
  get(key) {
    return this.cache.get(key) || null
  }

  /**
   * Set variation in cache
   * @param {string} key - Cache key
   * @param {Object} variation - Variation object
   */
  set(key, variation) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, variation)
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
  }
}

/**
 * Convenience function to create handwriting variation
 * @param {Object} options - Variation options
 * @returns {HandwritingVariation} Variation engine
 */
export function createHandwritingVariation(options = {}) {
  return new HandwritingVariation(options)
}

/**
 * Export singleton variation engine
 */
export const handwritingVariation = new HandwritingVariation()
