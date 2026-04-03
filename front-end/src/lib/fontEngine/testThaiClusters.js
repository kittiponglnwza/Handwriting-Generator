// testThaiClusters.js - Test Thai cluster parsing and layout
import { parseThai, parseThaiWithMetadata } from './ThaiClusterParser.js'

/**
 * Test Thai cluster parsing
 */
function testThaiClusterParsing() {
  console.log('=== Thai Cluster Parsing Test ===')
  
  const testCases = [
    'ก้',        // consonant + upper mark
    'เก',        // leading vowel + consonant  
    'เก้',       // leading vowel + consonant + upper mark
    'กา',        // consonant + following vowel
    'กุ',        // consonant + lower mark
    'กุ่',       // consonant + lower mark + upper mark
    'สวัสดี',    // multiple words
    'เสาร์',     // complex word
    'การ',       // consonant + vowel + mark
    'ผู้',       // consonant + lower mark + upper mark
  ]
  
  testCases.forEach(text => {
    console.log(`\\n--- Testing: "${text}" ---`)
    
    const clusters = parseThai(text)
    const clustersWithMeta = parseThaiWithMetadata(text)
    
    console.log(`Clusters: ${clusters.length}`)
    clusters.forEach((cluster, i) => {
      console.log(`  Cluster ${i}: "${cluster.text}"`)
      console.log(`    Base: ${cluster.baseChar}`)
      console.log(`    Leading: [${cluster.leadingVowels.join(', ')}]`)
      console.log(`    Following: [${cluster.followingVowels.join(', ')}]`)
      console.log(`    Upper marks: [${cluster.upperMarks.join(', ')}]`)
      console.log(`    Lower marks: [${cluster.lowerMarks.join(', ')}]`)
      console.log(`    Rendering order: [${cluster.getRenderingOrder().join(', ')}]`)
    })
  })
}

/**
 * Test cluster spacing logic
 */
function testClusterSpacing() {
  console.log('\\n=== Cluster Spacing Test ===')
  
  const text = 'เก้ การ'
  const clusters = parseThaiWithMetadata(text)
  
  console.log(`Text: "${text}"`)
  console.log(`Clusters: ${clusters.length}`)
  
  clusters.forEach((clusterData, i) => {
    const cluster = clusterData.cluster
    console.log(`\\nCluster ${i}: "${cluster.text}"`)
    console.log(`  Base char for spacing: "${clusterData.baseChar}"`)
    console.log(`  Has base char: ${clusterData.hasBaseChar}`)
    console.log(`  Is Thai: ${clusterData.isThai}`)
    console.log(`  Combining marks:`, clusterData.combiningMarks)
  })
}

/**
 * Run all tests
 */
export function runThaiClusterTests() {
  testThaiClusterParsing()
  testClusterSpacing()
  console.log('\\n=== Tests Complete ===')
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose to global
  window.runThaiClusterTests = runThaiClusterTests
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.runThaiClusterTests = runThaiClusterTests
}
