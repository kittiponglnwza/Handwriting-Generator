// demoFix.js - Demonstration of the Thai segmentation fix
// This shows the before/after of the segmentation change

console.log("=== Thai Segmentation Fix Demonstration ===\n")

// The OLD way (incorrect) - character iteration
function oldSegmentation(text) {
  // This was the problem - treating each Unicode codepoint separately
  return [...text].map(ch => ({ ch, type: 'character' }))
}

// The NEW way (correct) - grapheme cluster iteration  
function newSegmentation(text) {
  // Using Intl.Segmenter for proper Unicode grapheme clusters
  const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
  return [...segmenter.segment(text)].map(segment => ({ 
    cluster: segment.segment, 
    type: 'grapheme_cluster' 
  }))
}

// Test with Thai text
const thaiText = "สวัสดีครับ"

console.log(`Input: "${thaiText}"`)
console.log("")

console.log("OLD (BROKEN) - Character iteration:")
const oldResult = oldSegmentation(thaiText)
console.log(`Count: ${oldResult.length} units`)
oldResult.forEach((item, i) => {
  console.log(`  ${i + 1}. "${item.ch}" (U+${item.ch.codePointAt(0).toString(16).padStart(4, '0')})`)
})
console.log("")

console.log("NEW (FIXED) - Grapheme cluster iteration:")
const newResult = newSegmentation(thaiText)
console.log(`Count: ${newResult.length} units`)
newResult.forEach((item, i) => {
  console.log(`  ${i + 1}. "${item.cluster}"`)
})
console.log("")

console.log("=== Impact on Rendering ===")
console.log("OLD: Each character rendered separately → broken Thai")
console.log("NEW: Each cluster rendered as one unit → natural Thai")
console.log("")
console.log("✅ Fix implemented in tokens.js")
console.log("✅ Replaced segmentGraphemes() with segmentUnicodeGraphemes()")
console.log("✅ Now using Intl.Segmenter('th', { granularity: 'grapheme' })")
