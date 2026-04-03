// testLineWrapping.js - Test Thai cluster line wrapping
import { LayoutEngine } from './LayoutEngine.js'

/**
 * Test Thai cluster line wrapping
 */
function testThaiLineWrapping() {
  console.log('=== Thai Line Wrapping Test ===')
  
  // Create layout engine with narrow width to force wrapping
  const layoutEngine = new LayoutEngine({
    maxWidth: 200, // Narrow width to trigger wrapping
    letterSpacing: 0,
    kerning: true,
  })
  
  const testCases = [
    'สวัสดี',        // Simple greeting
    'การทดสอบ',      // Test word
    'เสาร์',          // Complex cluster
    'กำลังทดสอบ',   // Multiple words with clusters
    'ผู้ใช้งาน',      // User with marks
    'เก่อมาก',       // Leading vowel + consonant + marks
  ]
  
  testCases.forEach((text, index) => {
    console.log(`\\n--- Test ${index + 1}: "${text}" ---`)
    
    const positionedGlyphs = layoutEngine.layoutText(text, 24)
    
    // Analyze line breaks
    const lines = []
    let currentLine = []
    let lastY = null
    
    positionedGlyphs.forEach(glyph => {
      if (lastY === null || Math.abs(glyph.y - lastY) < 1) {
        // Same line (within 1 pixel tolerance)
        currentLine.push(glyph)
      } else {
        // New line
        if (currentLine.length > 0) {
          lines.push([...currentLine])
        }
        currentLine = [glyph]
      }
      lastY = glyph.y
    })
    
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
    
    console.log(`Lines: ${lines.length}`)
    lines.forEach((line, lineIndex) => {
      const lineText = line.map(g => g.glyph.char).join('')
      console.log(`  Line ${lineIndex + 1}: "${lineText}" (${line.length} glyphs)`)
      
      // Check if any cluster is broken
      const clusterBreaks = []
      for (let i = 0; i < line.length - 1; i++) {
        const current = line[i]
        const next = line[i + 1]
        
        // If current glyph has anchor type (is a mark) and next glyph doesn't (is base)
        // or vice versa, and they're at different X positions, cluster might be broken
        if ((current.anchorType && !next.anchorType) || (!current.anchorType && next.anchorType)) {
          const xDistance = Math.abs(next.x - current.x)
          if (xDistance > 50) { // Arbitrary threshold for "far apart"
            clusterBreaks.push(`${current.glyph.char}${next.glyph.char}`)
          }
        }
      }
      
      if (clusterBreaks.length > 0) {
        console.log(`    ⚠️  Possible broken clusters: ${clusterBreaks.join(', ')}`)
      } else {
        console.log(`    ✅ Clusters intact`)
      }
    })
  })
}

/**
 * Test cluster width calculation
 */
function testClusterWidthCalculation() {
  console.log('\\n=== Cluster Width Calculation Test ===')
  
  const layoutEngine = new LayoutEngine({ maxWidth: 150 })
  
  // Test single cluster that should wrap
  const text = 'การ' // Should stay together
  console.log(`Testing cluster integrity for: "${text}"`)
  
  const positionedGlyphs = layoutEngine.layoutText(text, 24)
  
  // Check if all glyphs are on same line
  const uniqueYPositions = [...new Set(positionedGlyphs.map(g => Math.round(glyph.y)))]
  
  if (uniqueYPositions.length === 1) {
    console.log('✅ Cluster stayed on same line')
  } else {
    console.log(`❌ Cluster broken across ${uniqueYPositions.length} lines`)
    console.log(`Y positions: ${uniqueYPositions.join(', ')}`)
  }
  
  // Show glyph positions
  console.log('Glyph positions:')
  positionedGlyphs.forEach(glyph => {
    console.log(`  "${glyph.glyph.char}": x=${Math.round(glyph.x)}, y=${Math.round(glyph.y)}, anchor=${glyph.anchorType || 'base'}`)
  })
}

/**
 * Run all line wrapping tests
 */
export function runLineWrappingTests() {
  testThaiLineWrapping()
  testClusterWidthCalculation()
  console.log('\\n=== Line Wrapping Tests Complete ===')
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to global
  window.runLineWrappingTests = runLineWrappingTests
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.runLineWrappingTests = runLineWrappingTests
}
