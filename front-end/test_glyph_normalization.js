// Test script for glyph normalization
import { calculateNormalizedViewBox, updateMedianConsonantHeight } from './src/core/rendering/SvgTracer.js'

// Mock glyph data to test normalization
const mockGlyphs = [
  { ch: 'ก', glyphMetrics: { height: 40, width: 35 } },  // Base consonant
  { ch: 'ข', glyphMetrics: { height: 42, width: 38 } },  // Base consonant  
  { ch: 'ค', glyphMetrics: { height: 39, width: 36 } },  // Base consonant
  { ch: 'ง', glyphMetrics: { height: 41, width: 37 } },  // Base consonant
  { ch: 'จ', glyphMetrics: { height: 38, width: 34 } },  // Base consonant
  { ch: '่', glyphMetrics: { height: 15, width: 20 } },  // Tone mark (should be ignored)
  { ch: '้', glyphMetrics: { height: 18, width: 22 } },  // Tone mark (should be ignored)
  { ch: 'า', glyphMetrics: { height: 25, width: 30 } },  // Vowel
]

console.log('Testing glyph normalization...')

// Test 1: Calculate median consonant height
updateMedianConsonantHeight(mockGlyphs)
console.log('Median consonant height calculated')

// Test 2: Test normalization for different glyph types
const testCases = [
  { width: 35, height: 40, minX: 5, minY: 8, name: 'Base consonant' },
  { width: 20, height: 15, minX: 2, minY: 3, name: 'Tone mark' },
  { width: 30, height: 25, minX: 4, minY: 5, name: 'Vowel' },
  { width: 25, height: 80, minX: 3, minY: 10, name: 'Extreme outlier' },
]

testCases.forEach(testCase => {
  const normalized = calculateNormalizedViewBox(
    testCase.width, testCase.height, testCase.minX, testCase.minY, 50, 50
  )
  
  console.log(`\n${testCase.name}:`)
  console.log(`  Original: ${testCase.width}x${testCase.height}`)
  console.log(`  Normalized viewBox: ${normalized.viewBox}`)
  console.log(`  Target height: ${normalized.targetHeight}`)
  console.log(`  Scale: ${normalized.transform.scaleX.toFixed(2)}`)
})

console.log('\nNormalization test completed!')
