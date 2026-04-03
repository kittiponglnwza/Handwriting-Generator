// segmentationTest.js - Test Unicode grapheme cluster segmentation
// This file tests that Intl.Segmenter is working correctly for Thai text

// ─── Test function using Intl.Segmenter ───────────────────────────────────

function testThaiSegmentation() {
  console.log("=== Thai Grapheme Cluster Segmentation Test ===\n")
  
  const testCases = [
    {
      input: "สวัสดีครับ",
      expected: ["ส", "วั", "ส", "ดี", "ค", "รั", "บ"],
      description: "Common greeting"
    },
    {
      input: "การเรียน", 
      expected: ["ก", "า", "ร", "เ", "รี", "ย", "น"],
      description: "Learning"
    },
    {
      input: "ภาษาไทย",
      expected: ["ภ", "า", "ษ", "า", "ไ", "ท", "ย"],
      description: "Thai language"
    },
    {
      input: "เกาะ",
      expected: ["เ", "ก", "า", "ะ"],
      description: "Island"
    },
    {
      input: "เกาะสีดา",
      expected: ["เ", "ก", "า", "ะ", "ส", "ี", "ด", "า"],
      description: "Sida island"
    }
  ]
  
  // Use the same function as in tokens.js
  function segmentUnicodeGraphemes(text) {
    if (!text) return []
    
    // Use Intl.Segmenter with Thai locale for optimal Thai handling
    const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
    return [...segmenter.segment(text)].map(segment => segment.segment)
  }
  
  let allPassed = true
  
  testCases.forEach((testCase, index) => {
    const { input, expected, description } = testCase
    const actual = segmentUnicodeGraphemes(input)
    
    const passed = JSON.stringify(actual) === JSON.stringify(expected)
    allPassed = allPassed && passed
    
    console.log(`Test ${index + 1}: ${description}`)
    console.log(`Input:    "${input}"`)
    console.log(`Expected: [${expected.map(s => `"${s}"`).join(', ')}]`)
    console.log(`Actual:   [${actual.map(s => `"${s}"`).join(', ')}]`)
    console.log(`Result:   ${passed ? '✅ PASS' : '❌ FAIL'}`)
    console.log('')
  })
  
  console.log(`=== Summary ===`)
  console.log(`All tests ${allPassed ? 'PASSED' : 'FAILED'}`)
  
  return allPassed
}

// ─── Test character iteration vs cluster iteration ─────────────────────────

function testIterationDifference() {
  console.log("\n=== Character vs Cluster Iteration Test ===\n")
  
  const testText = "สวัสดีครับ"
  
  console.log(`Input text: "${testText}"`)
  console.log('')
  
  // OLD WAY: Character iteration (WRONG)
  console.log("OLD WAY - Character iteration:")
  const chars = [...testText]
  console.log(`Count: ${chars.length} characters`)
  console.log(`Result: [${chars.map(s => `"${s}"`).join(', ')}]`)
  console.log('')
  
  // NEW WAY: Cluster iteration (CORRECT)
  console.log("NEW WAY - Cluster iteration:")
  function segmentUnicodeGraphemes(text) {
    if (!text) return []
    const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
    return [...segmenter.segment(text)].map(segment => segment.segment)
  }
  const clusters = segmentUnicodeGraphemes(testText)
  console.log(`Count: ${clusters.length} clusters`)
  console.log(`Result: [${clusters.map(s => `"${s}"`).join(', ')}]`)
  console.log('')
  
  console.log(`Difference: ${clusters.length} clusters vs ${chars.length} characters`)
  console.log(`Improvement: Proper grapheme cluster segmentation`)
}

// ─── Export for use in browser console ───────────────────────────────────────

export { testThaiSegmentation, testIterationDifference }

// Auto-run if this file is loaded
if (typeof window !== 'undefined') {
  window.testThaiSegmentation = testThaiSegmentation
  window.testIterationDifference = testIterationDifference
  console.log("Thai segmentation test loaded. Run testThaiSegmentation() to test.")
}
