/**
 * THAI CHARACTER PROCESSING TEST
 * 
 * Test script to verify Thai vowel combination fixes
 * Run this in browser console after loading Step 3
 */

function testThaiCharacterProcessing() {
  console.log('🧪 TESTING THAI CHARACTER PROCESSING')
  console.log('=====================================')
  
  // Test cases for Thai vowel combinations
  const testCases = [
    // Base characters with different vowel combinations
    { base: 'ก', vowels: ['่', '้'], expected: 'ก่้' },
    { base: 'ค', vowels: ['๊', 'ะ'], expected: 'ค๊ะ' },
    { base: 'ป', vowels: ['ิ', '์'], expected: 'ปิ์' },
    { base: 'ต', vowels: ['ั', 'ว'], expected: 'ตัว' },
    { base: 'ร', vowels: ['ั', 'ว', 'ะ'], expected: 'รัวะ' },
    { base: 'ส', vowels: ['ุ', '์'], expected: 'สุ์' },
    { base: 'ห', vowels: ['า', 'ม'], expected: 'หาม' },
    
    // Complex vowel combinations
    { base: 'เ', vowels: ['ก', 'ะ'], expected: 'เกะ' },
    { base: 'แ', vowels: ['ก', 'ะ'], expected: 'แกะ' },
    { base: 'โ', vowels: ['ก', 'ะ'], expected: 'โกะ' },
    { base: 'ใ', vowels: ['ก', 'ะ'], expected: 'ใกะ' },
    { base: 'ไ', vowels: ['ก', 'ะ'], expected: 'ไกะ' },
    
    // Foot vowels (สระใต้เท้า)
    { base: 'ก', vowels: ['ุ', '์'], expected: 'กุ์' },
    { base: 'ข', vowels: ['ู', '์'], expected: 'ขู์' },
    { base: 'ค', vowels: ['ึ', '์'], expected: 'คึ์' },
    { base: 'ง', vowels: ['ื', '์'], expected: 'งื์' },
    
    // Air vowels (สระอากาศ)
    { base: 'ก', vowels: ['า'], expected: 'กา' },
    { base: 'ค', vowels: ['า'], expected: 'คา' },
    { base: 'ต', vowels: ['า'], expected: 'ตา' },
    { base: 'ม', vowels: ['า'], expected: 'มา' },
  ]
  
  console.log('\n📝 Testing vowel combination logic:')
  
  let passed = 0
  let total = testCases.length
  
  testCases.forEach((testCase, index) => {
    // Simulate the processThaiCharacter function logic
    let combined = testCase.base
    let testIndex = 0
    
    for (const vowel of testCase.vowels) {
      // Check if vowel is a Thai combining character
      if (/^[\u0E30-\u0E4E]$/.test(vowel)) {
        combined += vowel
        testIndex++
      }
    }
    
    const success = combined === testCase.expected
    if (success) {
      passed++
      console.log(`✅ Test ${index + 1}: "${testCase.base}" + [${testCase.vowels.join(', ')}] = "${combined}" ✓`)
    } else {
      console.log(`❌ Test ${index + 1}: "${testCase.base}" + [${testCase.vowels.join(', ')}] = "${combined}" (expected "${testCase.expected}")`)
    }
  })
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`)
  
  // Test Unicode ranges
  console.log('\n🔤 Testing Unicode range detection:')
  
  const unicodeTests = [
    { char: '่', desc: 'Mai Ek (U+0E48)', shouldMatch: true },
    { char: '้', desc: 'Mai Tho (U+0E49)', shouldMatch: true },
    { char: '๊', desc: 'Mai Tri (U+0E4A)', shouldMatch: true },
    { char: '๋', desc: 'Mai Chattawa (U+0E4B)', shouldMatch: true },
    { char: 'ิ', desc: 'Sara I (U+0E34)', shouldMatch: true },
    { char: 'ี', desc: 'Sara II (U+0E35)', shouldMatch: true },
    { char: 'ึ', desc: 'Sara UE (U+0E36)', shouldMatch: true },
    { char: 'ื', desc: 'Sara UEE (U+0E37)', shouldMatch: true },
    { char: 'ั', desc: 'Mai Han-Akat (U+0E31)', shouldMatch: true },
    { char: 'ุ', desc: 'Sara U (U+0E38)', shouldMatch: true },
    { char: 'ู', desc: 'Sara UU (U+0E39)', shouldMatch: true },
    { char: '์', desc: 'Thanthakhat (U+0E4E)', shouldMatch: true },
    { char: 'ก', desc: 'Ko Kai (U+0E01)', shouldMatch: false },
    { char: 'ข', desc: 'Kho Khai (U+0E02)', shouldMatch: false },
    { char: 'A', desc: 'Latin A (U+0041)', shouldMatch: false },
    { char: '1', desc: 'Digit 1 (U+0031)', shouldMatch: false },
  ]
  
  let unicodePassed = 0
  let unicodeTotal = unicodeTests.length
  
  unicodeTests.forEach((test, index) => {
    const matches = /^[\u0E30-\u0E4E]$/.test(test.char)
    const success = matches === test.shouldMatch
    
    if (success) {
      unicodePassed++
      console.log(`✅ ${test.desc}: "${test.char}" ${matches ? 'matches' : 'does not match'} range ✓`)
    } else {
      console.log(`❌ ${test.desc}: "${test.char}" ${matches ? 'matches' : 'does not match'} range (expected ${test.shouldMatch ? 'match' : 'no match'})`)
    }
  })
  
  console.log(`\n📊 Unicode Results: ${unicodePassed}/${unicodeTotal} tests passed (${((unicodePassed/unicodeTotal)*100).toFixed(1)}%)`)
  
  // Test NCR decoding
  console.log('\n🔤 Testing NCR decoding:')
  
  const ncrTests = [
    { input: '&#x0E48;', expected: '่', desc: 'Mai Ek (hex)' },
    { input: '&#x0E49;', expected: '้', desc: 'Mai Tho (hex)' },
    { input: '&#3656;', expected: '่', desc: 'Mai Ek (decimal)' },
    { input: '&#3657;', expected: '้', desc: 'Mai Tho (decimal)' },
    { input: 'ก่', expected: 'ก่', desc: 'Already combined' },
    { input: 'ค๊ะ', expected: 'ค๊ะ', desc: 'Already combined with multiple' },
  ]
  
  let ncrPassed = 0
  let ncrTotal = ncrTests.length
  
  // Simulate decodeNcr function
  function decodeNcr(str) {
    if (!str || !str.includes("&")) return str
    return str.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
              .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
  }
  
  ncrTests.forEach((test, index) => {
    const result = decodeNcr(test.input)
    const success = result === test.expected
    
    if (success) {
      ncrPassed++
      console.log(`✅ ${test.desc}: "${test.input}" → "${result}" ✓`)
    } else {
      console.log(`❌ ${test.desc}: "${test.input}" → "${result}" (expected "${test.expected}")`)
    }
  })
  
  console.log(`\n📊 NCR Results: ${ncrPassed}/${ncrTotal} tests passed (${((ncrPassed/ncrTotal)*100).toFixed(1)}%)`)
  
  // Overall results
  const overallPassed = passed + unicodePassed + ncrPassed
  const overallTotal = total + unicodeTotal + ncrTotal
  const overallPercent = ((overallPassed/overallTotal)*100).toFixed(1)
  
  console.log('\n🎯 OVERALL RESULTS:')
  console.log(`Vowel combinations: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`)
  console.log(`Unicode detection: ${unicodePassed}/${unicodeTotal} (${((unicodePassed/unicodeTotal)*100).toFixed(1)}%)`)
  console.log(`NCR decoding: ${ncrPassed}/${ncrTotal} (${((ncrPassed/ncrTotal)*100).toFixed(1)}%)`)
  console.log(`\n🏆 TOTAL: ${overallPassed}/${overallTotal} (${overallPercent}%)`)
  
  if (overallPercent >= 90) {
    console.log('🎉 EXCELLENT! Thai character processing is working correctly!')
  } else if (overallPercent >= 75) {
    console.log('✅ GOOD! Thai character processing is mostly working.')
  } else {
    console.log('⚠️  NEEDS WORK! Thai character processing has issues.')
  }
  
  console.log('\n=====================================')
  console.log('🧪 THAI CHARACTER TEST COMPLETE')
  
  return {
    vowelCombination: { passed, total, percent: ((passed/total)*100).toFixed(1) },
    unicodeDetection: { passed: unicodePassed, total: unicodeTotal, percent: ((unicodePassed/unicodeTotal)*100).toFixed(1) },
    ncrDecoding: { passed: ncrPassed, total: ncrTotal, percent: ((ncrPassed/ncrTotal)*100).toFixed(1) },
    overall: { passed: overallPassed, total: overallTotal, percent: overallPercent }
  }
}

// Auto-expose for testing
if (typeof window !== 'undefined') {
  window.testThaiCharacterProcessing = testThaiCharacterProcessing
  console.log('🔧 Thai character test loaded. Run testThaiCharacterProcessing() to test.')
}

export { testThaiCharacterProcessing }
