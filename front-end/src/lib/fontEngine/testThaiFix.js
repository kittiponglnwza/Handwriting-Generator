// testThaiFix.js - Test Thai cluster line wrapping fix
import { LayoutEngine } from './LayoutEngine.js'

/**
 * Test the Thai line wrapping fix
 */
function testThaiFix() {
  console.log('=== Thai Line Wrapping Fix Test ===')
  
  // Create layout engine with narrow width to force wrapping
  const layoutEngine = new LayoutEngine({
    maxWidth: 300, // Narrow width to trigger wrapping
    letterSpacing: 0,
    kerning: true,
  })
  
  // Test the problematic text from the image
  const testText = 'น คอ ตัวอย่างเอกสารจากลายมา Step 5'
  
  console.log(`Testing: "${testText}"`)
  console.log(`Max width: ${layoutEngine.options.maxWidth}px`)
  
  const positionedGlyphs = layoutEngine.layoutText(testText, 24)
  
  // Group glyphs by Y position (lines)
  const lines = []
  let currentLine = []
  let lastY = null
  
  positionedGlyphs.forEach(glyph => {
    const y = Math.round(glyph.y)
    if (lastY === null || Math.abs(y - lastY) < 5) {
      // Same line (within 5 pixel tolerance)
      currentLine.push(glyph)
    } else {
      // New line
      if (currentLine.length > 0) {
        lines.push([...currentLine])
      }
      currentLine = [glyph]
    }
    lastY = y
  })
  
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }
  
  console.log(`\\nResult: ${lines.length} lines`)
  lines.forEach((line, index) => {
    const lineText = line.map(g => g.glyph.char).join('')
    const xPositions = line.map(g => Math.round(g.x))
    const yPositions = line.map(g => Math.round(g.y))
    
    console.log(`\\nLine ${index + 1}:`)
    console.log(`  Text: "${lineText}"`)
    console.log(`  Glyphs: ${line.length}`)
    console.log(`  X range: ${Math.min(...xPositions)} - ${Math.max(...xPositions)}`)
    console.log(`  Y position: ${yPositions[0]}`)
    
    // Check for broken Thai clusters
    const thaiClusters = []
    let currentCluster = ''
    
    line.forEach(glyph => {
      const char = glyph.glyph.char
      if (char.trim() === '') return // Skip spaces
      
      // Simple Thai cluster detection
      if (['่', '้', '๊', '๋', 'ิ', 'ี', 'ึ', 'ื', 'ั', 'ุ', 'ู', 'ฺ'].includes(char)) {
        currentCluster += char
      } else {
        if (currentCluster) {
          thaiClusters.push(currentCluster)
          currentCluster = ''
        }
        currentCluster = char
      }
    })
    
    if (currentCluster) {
      thaiClusters.push(currentCluster)
    }
    
    console.log(`  Thai clusters: [${thaiClusters.join(', ')}]`)
  })
  
  // Check if Thai clusters are broken across lines
  console.log('\\n=== Cluster Integrity Check ===')
  const allThaiChars = positionedGlyphs
    .filter(g => ['่', '้', '๊', '๋', 'ิ', 'ี', 'ึ', 'ื', 'ั', 'ุ', 'ู', 'ฺ', 
                     'ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 
                     'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท',
                     'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ม',
                     'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 'ห', 'ฬ', 'อ',
                     'ฮ', 'เ', 'แ', 'โ', 'ใ', 'ไ', 'า', 'ำ', 'ๅ', 'ฯ'].includes(g.glyph.char))
    .map(g => ({ char: g.glyph.char, y: Math.round(g.y), x: Math.round(g.x) }))
  
  const uniqueY = [...new Set(allThaiChars.map(c => c.y))]
  
  if (uniqueY.length > 1) {
    console.log('❌ Thai characters appear on multiple lines:')
    uniqueY.forEach(y => {
      const chars = allThaiChars.filter(c => c.y === y).map(c => c.char).join('')
      console.log(`  Line ${y}: "${chars}"`)
    })
  } else {
    console.log('✅ All Thai characters on same line')
  }
}

/**
 * Run the test
 */
export function runThaiFixTest() {
  testThaiFix()
  console.log('\\n=== Thai Fix Test Complete ===')
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  window.runThaiFixTest = runThaiFixTest
} else if (typeof global !== 'undefined') {
  global.runThaiFixTest = runThaiFixTest
}
