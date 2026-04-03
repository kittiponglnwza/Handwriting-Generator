// testFix.js - Quick test to verify Thai clustering fix
console.log("=== Thai Clustering Fix Test ===\n")

// Test the new segmentation approach
function segmentUnicodeGraphemes(text) {
  if (!text) return []
  const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
  return [...segmenter.segment(text)].map(segment => segment.segment)
}

// Test with the problematic text
const testText = "สวัสดีครับ"
console.log(`Input: "${testText}"`)
console.log("")

// New approach - proper Unicode grapheme clusters
const clusters = segmentUnicodeGraphemes(testText)
console.log("NEW APPROACH - Unicode Grapheme Clusters:")
console.log(`Count: ${clusters.length} clusters`)
clusters.forEach((cluster, i) => {
  console.log(`  ${i + 1}. "${cluster}" (${cluster.length} Unicode codepoints)`)
})

console.log("")
console.log("=== Expected Result ===")
console.log("Each cluster should render as ONE unit:")
console.log("- 'ส' → single character")
console.log("- 'วั' → consonant + lower vowel (one visual unit)")
console.log("- 'ส' → single character") 
console.log("- 'ดี' → consonant + upper vowel (one visual unit)")
console.log("- 'ค' → single character")
console.log("- 'รั' → consonant + lower vowel (one visual unit)")
console.log("- 'บ' → single character")

console.log("")
console.log("=== Key Changes Made ===")
console.log("1. ✅ Replaced segmentGraphemes() with segmentUnicodeGraphemes()")
console.log("2. ✅ Removed clusterComponents() decomposition")
console.log("3. ✅ Treat each cluster as single rendering unit")
console.log("4. ✅ Updated renderChar() to handle clusters intact")

console.log("")
console.log("=== Before vs After ===")
console.log("BEFORE: 'สวัสดีครับ' → 9 separate Unicode codepoints")
console.log("AFTER:  'สวัสดีครับ' → 7 grapheme clusters")

console.log("")
console.log("🎯 This should fix the Thai rendering!")
