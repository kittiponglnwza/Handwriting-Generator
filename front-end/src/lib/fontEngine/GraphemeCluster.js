// GraphemeCluster.js - Thai grapheme cluster parsing and analysis
// Handles Unicode grapheme cluster segmentation for proper Thai rendering

/**
 * Thai Unicode character categories for grapheme cluster analysis
 */
const THAI_CATEGORIES = {
  // Consonants (ก-ฮ)
  CONSONANT: {
    start: 0x0e01,
    end: 0x0e2e,
  },
  
  // Leading vowels (เ แ โ ใ ไ)
  LEADING_VOWEL: {
    characters: [0x0e40, 0x0e41, 0x0e42, 0x0e43, 0x0e44],
  },
  
  // Following vowels (า ำ ๅ)
  FOLLOWING_VOWEL: {
    characters: [0x0e32, 0x0e33, 0x0e45, 0x0e46],
  },
  
  // Upper vowels and tone marks (ิ ี ึ ื ั ่ ้ ๊ ๋)
  UPPER_MARK: {
    characters: [0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e47, 0x0e48, 0x0e49, 0x0e4a, 0x0e4b],
  },
  
  // Lower vowels (ุ ู ฺ)
  LOWER_MARK: {
    characters: [0x0e38, 0x0e39, 0x0e3a],
  },
  
  // Special characters
  SPECIAL: {
    characters: [0x0e3f, 0x0e4c, 0x0e4d, 0x0e4e], // ฿ ฼ ฽ ฾
  },
}

/**
 * Get Thai character category
 * @param {number} codePoint - Unicode code point
 * @returns {string|null} Category name
 */
function getThaiCategory(codePoint) {
  // Check consonants
  if (codePoint >= THAI_CATEGORIES.CONSONANT.start && codePoint <= THAI_CATEGORIES.CONSONANT.end) {
    return 'CONSONANT'
  }
  
  // Check specific character categories
  for (const [categoryName, category] of Object.entries(THAI_CATEGORIES)) {
    if (categoryName === 'CONSONANT') continue
    
    if (category.characters.includes(codePoint)) {
      return categoryName
    }
  }
  
  return null
}

/**
 * Check if character is Thai
 * @param {string} char 
 * @returns {boolean}
 */
function isThaiCharacter(char) {
  const codePoint = char.codePointAt(0)
  return getThaiCategory(codePoint) !== null
}

/**
 * Thai grapheme cluster class
 * Represents a single visual character unit (may contain multiple Unicode code points)
 */
export class GraphemeCluster {
  /**
   * @param {string} text - The cluster text
   * @param {Array} codePoints - Array of Unicode code points
   * @param {Array} categories - Array of character categories
   */
  constructor(text, codePoints, categories) {
    this.text = text
    this.codePoints = codePoints
    this.categories = categories
    this.baseChar = null
    this.leadingVowels = []
    this.followingVowels = []
    this.upperMarks = []
    this.lowerMarks = []
    this.specialChars = []
    
    this.parseStructure()
  }

  /**
   * Parse the cluster structure into components
   */
  parseStructure() {
    for (let i = 0; i < this.codePoints.length; i++) {
      const codePoint = this.codePoints[i]
      const category = this.categories[i]
      const char = String.fromCodePoint(codePoint)
      
      switch (category) {
        case 'CONSONANT':
          this.baseChar = char
          break
        case 'LEADING_VOWEL':
          this.leadingVowels.push(char)
          break
        case 'FOLLOWING_VOWEL':
          this.followingVowels.push(char)
          break
        case 'UPPER_MARK':
          this.upperMarks.push(char)
          break
        case 'LOWER_MARK':
          this.lowerMarks.push(char)
          break
        case 'SPECIAL':
          this.specialChars.push(char)
          break
      }
    }
  }

  /**
   * Get all characters in rendering order
   * @returns {Array} Array of characters in correct rendering order
   */
  getRenderingOrder() {
    const order = []
    
    // Leading vowels come first
    order.push(...this.leadingVowels)
    
    // Base character (consonant) comes next
    if (this.baseChar) {
      order.push(this.baseChar)
    }
    
    // Following vowels come after base
    order.push(...this.followingVowels)
    
    // Upper marks (tone marks, upper vowels)
    order.push(...this.upperMarks)
    
    // Lower marks
    order.push(...this.lowerMarks)
    
    // Special characters
    order.push(...this.specialChars)
    
    return order
  }

  /**
   * Check if cluster has a base character
   * @returns {boolean}
   */
  hasBaseChar() {
    return this.baseChar !== null
  }

  /**
   * Check if cluster has combining marks
   * @returns {boolean}
   */
  hasCombiningMarks() {
    return this.upperMarks.length > 0 || this.lowerMarks.length > 0
  }

  /**
   * Check if cluster is a single character
   * @returns {boolean}
   */
  isSingleChar() {
    return this.codePoints.length === 1
  }

  /**
   * Get cluster type for layout purposes
   * @returns {string} 'simple', 'complex', or 'standalone'
   */
  getClusterType() {
    if (this.isSingleChar()) return 'simple'
    if (this.hasBaseChar()) return 'complex'
    return 'standalone'
  }

  /**
   * Get the base character for anchor positioning
   * @returns {string|null}
   */
  getBaseChar() {
    return this.baseChar
  }

  /**
   * Get all combining marks that need anchor positioning
   * @returns {Array} Array of {char, type} objects
   */
  getCombiningMarks() {
    const marks = []
    
    this.upperMarks.forEach(char => {
      marks.push({ char, type: 'top' })
    })
    
    this.lowerMarks.forEach(char => {
      marks.push({ char, type: 'bottom' })
    })
    
    return marks
  }
}

/**
 * Grapheme cluster parser for Thai text
 */
export class GraphemeClusterParser {
  constructor() {
    // Use Intl.Segmenter for proper Unicode grapheme cluster segmentation
    this.segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
  }

  /**
   * Parse text into grapheme clusters
   * @param {string} text - Input text
   * @returns {Array<GraphemeCluster>} Array of grapheme clusters
   */
  parse(text) {
    if (!text) return []
    
    const clusters = []
    
    // Use Intl.Segmenter to get proper grapheme clusters
    const segments = [...this.segmenter.segment(text)]
    
    for (const segment of segments) {
      const clusterText = segment.segment
      const codePoints = [...clusterText].map(char => char.codePointAt(0))
      const categories = codePoints.map(cp => getThaiCategory(cp))
      
      const cluster = new GraphemeCluster(clusterText, codePoints, categories)
      clusters.push(cluster)
    }
    
    return clusters
  }

  /**
   * Parse text into clusters with additional metadata
   * @param {string} text - Input text
   * @returns {Array} Array of cluster objects with metadata
   */
  parseWithMetadata(text) {
    const clusters = this.parse(text)
    
    return clusters.map((cluster, index) => ({
      cluster,
      index,
      text: cluster.text,
      type: cluster.getClusterType(),
      hasBaseChar: cluster.hasBaseChar(),
      hasCombiningMarks: cluster.hasCombiningMarks(),
      isThai: cluster.codePoints.some(cp => getThaiCategory(cp) !== null),
      renderingOrder: cluster.getRenderingOrder(),
      baseChar: cluster.getBaseChar(),
      combiningMarks: cluster.getCombiningMarks(),
    }))
  }

  /**
   * Get statistics about parsed text
   * @param {string} text - Input text
   * @returns {Object} Statistics object
   */
  getStatistics(text) {
    const clusters = this.parse(text)
    
    const stats = {
      totalClusters: clusters.length,
      simpleClusters: 0,
      complexClusters: 0,
      standaloneClusters: 0,
      thaiClusters: 0,
      nonThaiClusters: 0,
      totalCodePoints: 0,
      averageCodePointsPerCluster: 0,
    }
    
    clusters.forEach(cluster => {
      const type = cluster.getClusterType()
      if (type === 'simple') stats.simpleClusters++
      else if (type === 'complex') stats.complexClusters++
      else stats.standaloneClusters++
      
      if (cluster.codePoints.some(cp => getThaiCategory(cp) !== null)) {
        stats.thaiClusters++
      } else {
        stats.nonThaiClusters++
      }
      
      stats.totalCodePoints += cluster.codePoints.length
    })
    
    stats.averageCodePointsPerCluster = stats.totalCodePoints / stats.totalClusters
    
    return stats
  }
}

/**
 * Convenience function to parse text into grapheme clusters
 * @param {string} text - Input text
 * @returns {Array<GraphemeCluster>} Array of grapheme clusters
 */
export function parseGraphemeClusters(text) {
  const parser = new GraphemeClusterParser()
  return parser.parse(text)
}

/**
 * Convenience function to parse text with metadata
 * @param {string} text - Input text
 * @returns {Array} Array of cluster objects with metadata
 */
export function parseGraphemeClustersWithMetadata(text) {
  const parser = new GraphemeClusterParser()
  return parser.parseWithMetadata(text)
}

/**
 * Export singleton parser instance
 */
export const graphemeParser = new GraphemeClusterParser()
