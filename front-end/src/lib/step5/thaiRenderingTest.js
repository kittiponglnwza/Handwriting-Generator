// thaiRenderingTest.js - Test and demonstration of Thai anchor positioning
//
// This file contains test cases and examples to verify that the Thai
// handwriting rendering engine correctly handles grapheme clusters
// with anchor positioning.

import { segmentGraphemes, clusterComponents } from "./tokens.js"
import { calculateAnchorPositions, calculateClusterWidth, validateAnchorPositions } from "./thaiAnchors.js"

// ─── Test cases for Thai grapheme clusters ───────────────────────────────────

const TEST_CASES = [
  // Basic consonants
  { text: "ก", description: "Single consonant" },
  { text: "ข", description: "Single consonant with different shape" },
  
  // Consonants with upper vowels/tone marks
  { text: "กา", description: "Consonant + trailing vowel า" },
  { text: "กิ", description: "Consonant + upper vowel ิ" },
  { text: "กี", description: "Consonant + upper vowel ี" },
  { text: "กึ", description: "Consonant + upper vowel ึ" },
  { text: "กือ", description: "Consonant + upper vowel ื" },
  
  // Consonants with lower vowels
  { text: "กุ", description: "Consonant + lower vowel ุ" },
  { text: "กู", description: "Consonant + lower vowel ู" },
  { text: "กฺ", description: "Consonant + lower vowel ฺ" },
  
  // Tone marks
  { text: "ก่", description: "Consonant + tone mark ่" },
  { text: "ก้", description: "Consonant + tone mark ้" },
  { text: "ก๊", description: "Consonant + tone mark ๊" },
  { text: "ก๋", description: "Consonant + tone mark ๋" },
  
  // Leading vowels
  { text: "เก", description: "Leading vowel เ + consonant" },
  { text: "แก", description: "Leading vowel แ + consonant" },
  { text: "โก", description: "Leading vowel โ + consonant" },
  { text: "ใก", description: "Leading vowel ใ + consonant" },
  { text: "ไก", description: "Leading vowel ไ + consonant" },
  
  // Complex clusters
  { text: "เกา", description: "Leading vowel + consonant + trailing vowel" },
  { text: "เกี", description: "Leading vowel + consonant + upper vowel" },
  { text: "เกาะ", description: "Leading vowel + consonant + trailing vowel + ะ" },
  { text: "เกาะ", description: "Leading vowel + consonant + trailing vowel + ะ" },
  
  // Multiple tone marks (should be handled correctly)
  { text: "ก่า", description: "Consonant + tone mark + trailing vowel" },
  { text: "เก้า", description: "Leading vowel + consonant + tone mark + trailing vowel" },
  
  // Real words
  { text: "สวัสดี", description: "Common greeting" },
  { text: "การ", description: "Common word with leading vowel" },
  { text: "ภาษาไทย", description: "Thai language" },
  { text: "เรียน", description: "To study/learn" },
  { text: "การบ้าน", description: "Homework" },
]

// ─── Test functions ───────────────────────────────────────────────────────────

export function runThaiRenderingTests(fontSize = 32) {
  console.log("=== Thai Handwriting Rendering Tests ===\n")
  
  const results = []
  
  for (const testCase of TEST_CASES) {
    const { text, description } = testCase
    
    try {
      // Test grapheme segmentation
      const clusters = segmentGraphemes(text)
      
      // Test each cluster
      const clusterResults = clusters.map((cluster, idx) => {
        const components = clusterComponents(cluster)
        const positions = calculateAnchorPositions({ subGlyphs: components.map(ch => ({ ch })) }, fontSize)
        const width = calculateClusterWidth(cluster)
        const validation = validateAnchorPositions(positions)
        
        return {
          cluster,
          components,
          positions,
          width,
          validation,
          isValid: validation.valid
        }
      })
      
      const allValid = clusterResults.every(r => r.isValid)
      
      results.push({
        text,
        description,
        clusters,
        results: clusterResults,
        allValid,
        success: true
      })
      
      console.log(`✓ ${description}: "${text}"`)
      console.log(`  Clusters: [${clusters.join(', ')}]`)
      console.log(`  Valid: ${allValid ? 'YES' : 'NO'}`)
      
      if (!allValid) {
        console.log(`  Issues:`)
        clusterResults.forEach((r, i) => {
          if (!r.isValid) {
            console.log(`    Cluster ${i}: ${r.validation.issues.join(', ')}`)
          }
        })
      }
      console.log('')
      
    } catch (error) {
      console.log(`✗ ${description}: "${text}" - ERROR: ${error.message}`)
      results.push({
        text,
        description,
        error: error.message,
        success: false
      })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  const validCount = results.filter(r => r.allValid).length
  
  console.log(`=== Summary ===`)
  console.log(`Total tests: ${results.length}`)
  console.log(`Successful: ${successCount}/${results.length}`)
  console.log(`Valid rendering: ${validCount}/${results.length}`)
  
  return results
}

// ─── Demonstration of anchor positioning ─────────────────────────────────────

export function demonstrateAnchorPositions() {
  console.log("\n=== Anchor Positioning Demonstration ===\n")
  
  const examples = [
    "ก",      // Single consonant
    "กา",     // Consonant + trailing vowel  
    "กิ",     // Consonant + upper vowel
    "กุ",     // Consonant + lower vowel
    "เก",     // Leading vowel + consonant
    "เกา",    // Leading vowel + consonant + trailing vowel
    "เกาะ",   // Leading vowel + consonant + trailing vowel + ะ
    "ก้",     // Consonant + tone mark
    "เก้า",   // Leading vowel + consonant + tone mark + trailing vowel
  ]
  
  for (const text of examples) {
    console.log(`Cluster: "${text}"`)
    const clusters = segmentGraphemes(text)
    
    clusters.forEach((cluster, idx) => {
      const components = clusterComponents(cluster)
      const positions = calculateAnchorPositions({ subGlyphs: components.map(ch => ({ ch })) })
      
      console.log(`  Components: [${components.join(', ')}]`)
      console.log(`  Anchor positions:`)
      
      positions.forEach(pos => {
        console.log(`    "${pos.component.ch}" -> ${pos.anchorType} (${pos.offsetX.toFixed(1)}, ${pos.offsetY.toFixed(1)}) scale:${pos.scale}`)
      })
      
      const width = calculateClusterWidth(cluster)
      console.log(`  Cluster width: ${width.toFixed(2)}x base width`)
    })
    console.log('')
  }
}

// ─── Performance test for large text ─────────────────────────────────────────

export function performanceTest(text = "สวัสดีครับ นี่คือการทดสอบประสิทธิภาพของระบบการแสดงผลตัวอักษรไทย", iterations = 100) {
  console.log(`\n=== Performance Test (${iterations} iterations) ===\n`)
  
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    const clusters = segmentGraphemes(text)
    
    for (const cluster of clusters) {
      const components = clusterComponents(cluster)
      calculateAnchorPositions({ subGlyphs: components.map(ch => ({ ch })) })
      calculateClusterWidth(cluster)
    }
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  const avgTime = totalTime / iterations
  
  console.log(`Text: "${text}"`)
  console.log(`Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`Average time per iteration: ${avgTime.toFixed(2)}ms`)
  console.log(`Characters per second: ${(text.length * 1000 / avgTime).toFixed(0)}`)
  
  return {
    totalTime,
    avgTime,
    charsPerSecond: text.length * 1000 / avgTime
  }
}

// ─── Export for use in development/debugging ─────────────────────────────────

export const ThaiTestUtils = {
  runThaiRenderingTests,
  demonstrateAnchorPositions,
  performanceTest,
  TEST_CASES
}

// Auto-run demonstration if this file is executed directly
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  console.log("Thai Rendering Test Suite loaded. Run ThaiTestUtils.runThaiRenderingTests() to test.")
}
