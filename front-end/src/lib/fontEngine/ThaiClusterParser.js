// ThaiClusterParser.js - Thai text cluster parsing for proper layout
// Groups Thai characters into logical clusters for correct rendering

/**
 * Thai character categories
 */
const THAI_CATEGORIES = {
  // Consonants (ก-ฮ)
  CONSONANTS: new Set(Array.from({length: 0x2e - 0x01 + 1}, (_, i) => 0x0e01 + i)),
  
  // Leading vowels (เ แ โ ใ ไ)
  LEADING_VOWELS: new Set([0x0e40, 0x0e41, 0x0e42, 0x0e43, 0x0e44]),
  
  // Following vowels (า ำ ๅ)
  FOLLOWING_VOWELS: new Set([0x0e32, 0x0e33, 0x0e45, 0x0e46]),
  
  // Upper marks (ิ ี ึ ื ั ่ ้ ๊ ๋)
  UPPER_MARKS: new Set([0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e47, 0x0e48, 0x0e49, 0x0e4a, 0x0e4b]),
  
  // Lower marks (ุ ู ฺ)
  LOWER_MARKS: new Set([0x0e38, 0x0e39, 0x0e3a]),
  
  // Special characters
  SPECIAL: new Set([0x0e3f, 0x0e4c, 0x0e4d, 0x0e4e]), // ฿ ฼ ฽ ฾
}

/**
 * Get Thai character category
 * @param {string} char 
 * @returns {string|null}
 */
function getThaiCategory(char) {
  const codePoint = char.codePointAt(0)
  
  if (THAI_CATEGORIES.CONSONANTS.has(codePoint)) return 'consonant'
  if (THAI_CATEGORIES.LEADING_VOWELS.has(codePoint)) return 'leading_vowel'
  if (THAI_CATEGORIES.FOLLOWING_VOWELS.has(codePoint)) return 'following_vowel'
  if (THAI_CATEGORIES.UPPER_MARKS.has(codePoint)) return 'upper_mark'
  if (THAI_CATEGORIES.LOWER_MARKS.has(codePoint)) return 'lower_mark'
  if (THAI_CATEGORIES.SPECIAL.has(codePoint)) return 'special'
  
  return null
}

/**
 * Thai cluster class
 */
export class ThaiCluster {
  constructor() {
    this.leadingVowels = []
    this.baseChar = null
    this.followingVowels = []
    this.upperMarks = []
    this.lowerMarks = []
    this.specialChars = []
    this.text = ''
  }
  
  /**
   * Add character to cluster
   * @param {string} char 
   * @param {string} category 
   */
  addChar(char, category) {
    this.text += char
    
    switch (category) {
      case 'leading_vowel':
        this.leadingVowels.push(char)
        break
      case 'consonant':
        this.baseChar = char
        break
      case 'following_vowel':
        this.followingVowels.push(char)
        break
      case 'upper_mark':
        this.upperMarks.push(char)
        break
      case 'lower_mark':
        this.lowerMarks.push(char)
        break
      case 'special':
        this.specialChars.push(char)
        break
    }
  }
  
  /**
   * Check if cluster is empty
   */
  isEmpty() {
    return this.text.length === 0
  }
  
  /**
   * Get rendering order of characters
   */
  getRenderingOrder() {
    const order = []
    
    // Leading vowels come first
    order.push(...this.leadingVowels)
    
    // Base character comes next
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
   * Get cluster width based on base character
   */
  getClusterWidth() {
    // For now, cluster width is determined by base character
    // In a more complex implementation, this could consider all characters
    return this.baseChar ? 1 : this.leadingVowels.length + this.followingVowels.length
  }
  
  /**
   * Check if cluster has base character
   */
  hasBaseChar() {
    return this.baseChar !== null
  }
  
  /**
   * Get base character for spacing
   */
  getBaseChar() {
    return this.baseChar || this.leadingVowels[0] || this.followingVowels[0] || this.text[0]
  }
  
  /**
   * Get combining marks with their types
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
 * Parse Thai text into clusters
 * @param {string} text - Input text
 * @returns {Array<ThaiCluster>} Array of Thai clusters
 */
export function parseThai(text) {
  if (!text) return []
  
  const clusters = []
  let currentCluster = new ThaiCluster()
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const category = getThaiCategory(char)
    
    // Handle non-Thai characters (spaces, punctuation, etc.)
    if (!category) {
      // Finish current cluster if not empty
      if (!currentCluster.isEmpty()) {
        clusters.push(currentCluster)
        currentCluster = new ThaiCluster()
      }
      
      // Create single-character cluster for non-Thai
      const nonThaiCluster = new ThaiCluster()
      nonThaiCluster.addChar(char, 'other')
      clusters.push(nonThaiCluster)
      continue
    }
    
    // Handle cluster boundaries
    if (category === 'consonant' && currentCluster.hasBaseChar()) {
      // New consonant starts new cluster
      clusters.push(currentCluster)
      currentCluster = new ThaiCluster()
    } else if (category === 'leading_vowel' && currentCluster.hasBaseChar()) {
      // CRITICAL FIX: A leading vowel (เ แ โ ใ ไ) always belongs to the NEXT consonant.
      // If the current cluster already has a base char, this leading vowel opens a new cluster.
      // Without this, "เก่าเดิน" would attach เ of เดิน into the เก่า cluster,
      // corrupting cluster boundaries and causing marks to appear on the wrong line.
      clusters.push(currentCluster)
      currentCluster = new ThaiCluster()
    }
    
    currentCluster.addChar(char, category)
  }
  
  // Add final cluster if not empty
  if (!currentCluster.isEmpty()) {
    clusters.push(currentCluster)
  }
  
  return clusters
}

/**
 * Parse Thai text with metadata
 * @param {string} text - Input text
 * @returns {Array} Array of cluster objects with metadata
 */
export function parseThaiWithMetadata(text) {
  const clusters = parseThai(text)
  
  return clusters.map((cluster, index) => ({
    cluster,
    index,
    text: cluster.text,
    hasBaseChar: cluster.hasBaseChar(),
    baseChar: cluster.getBaseChar(),
    renderingOrder: cluster.getRenderingOrder(),
    combiningMarks: cluster.getCombiningMarks(),
    isThai: getThaiCategory(cluster.text[0]) !== null,
  }))
}

/**
 * Export singleton parser
 */
export const thaiClusterParser = {
  parse: parseThai,
  parseWithMetadata: parseThaiWithMetadata,
  getThaiCategory,
}