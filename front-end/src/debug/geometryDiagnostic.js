/**
 * RUNTIME GEOMETRY DIAGNOSTIC
 * 
 * Paste this script in the browser console during Step 3 to analyze actual geometry
 */

function analyzeCurrentGeometry() {
  console.log('🔍 LIVE GEOMETRY ANALYSIS - Step 3')
  
  // Get current page data from Step 3
  const step3Component = document.querySelector('[data-step="3"]') || 
                          Array.from(document.querySelectorAll('*')).find(el => 
                            el.textContent?.includes('Grid Alignment') && el.textContent?.includes('overflow'))
  
  if (!step3Component) {
    console.error('❌ Step 3 component not found. Make sure you\'re on Step 3.')
    return
  }
  
  // Try to access React component internals (if available)
  const reactRoot = step3Component._reactRoot || step3Component.__reactInternalInstance
  let pageData = null
  
  // Look for page data in React state
  const searchForPageData = (obj, depth = 0) => {
    if (depth > 10) return null
    if (!obj || typeof obj !== 'object') return null
    
    // Look for page data patterns
    if (obj.pages && Array.isArray(obj.pages)) {
      return obj
    }
    
    for (const key in obj) {
      if (key.includes('page') || key.includes('glyph')) {
        const result = searchForPageData(obj[key], depth + 1)
        if (result) return result
      }
    }
    return null
  }
  
  pageData = searchForPageData(reactRoot)
  
  if (!pageData) {
    console.warn('⚠️  Could not access page data from React. Using fallback analysis.')
    
    // Analyze visible glyph grid instead
    const glyphCards = document.querySelectorAll('.glyph-card')
    if (glyphCards.length === 0) {
      console.error('❌ No glyph cards found. Make sure glyphs are loaded.')
      return
    }
    
    console.log(`📊 Found ${glyphCards.length} glyph cards`)
    
    // Analyze first few glyphs for overflow patterns
    const overflowGlyphs = Array.from(glyphCards).slice(0, 10).map((card, index) => {
      const statusText = card.textContent?.includes('Overflow') ? 'overflow' :
                       card.textContent?.includes('Missing') ? 'missing' : 'ok'
      const img = card.querySelector('img')
      const rect = card.getBoundingClientRect()
      
      return {
        index,
        status: statusText,
        cardPosition: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        hasImage: !!img,
        imageSrc: img?.src?.substring(0, 50) + '...'
      }
    })
    
    console.log('Sample glyph analysis:', overflowGlyphs)
    
    // Check for canvas elements (used in glyph extraction)
    const canvases = document.querySelectorAll('canvas')
    console.log(`Found ${canvases.length} canvas elements`)
    
    canvases.forEach((canvas, i) => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const darkPixels = Array.from(imageData.data).filter((val, idx) => 
          idx % 4 === 3 && val > 0 && imageData.data[idx - 1] < 235
        ).length
        
        console.log(`Canvas ${i}: ${canvas.width}×${canvas.height}, dark pixels: ${darkPixels}`)
      }
    })
    
    return
  }
  
  // If we have page data, do detailed analysis
  console.log('✅ Page data found:', pageData)
  
  const pages = pageData.pages || []
  console.log(`📄 Analyzing ${pages.length} pages`)
  
  pages.forEach((page, pageIndex) => {
    console.log(`\n--- Page ${pageIndex + 1} ---`)
    console.log(`Dimensions: ${page.pageWidth}×${page.pageHeight}`)
    console.log(`Has imageData: ${!!page.imageData}`)
    console.log(`Has regDots: ${page.regDots?.length || 0}`)
    console.log(`Has anchors: ${page.anchors?.length || 0}`)
    console.log(`AutoCalibration:`, page.autoCalibration)
    console.log(`AutoScore:`, page.autoScore)
    console.log(`AutoSource:`, page.autoSource)
    
    if (page.regDots && page.regDots.length >= 4) {
      console.log('RegDot positions:', page.regDots.slice(0, 8))
    }
  })
  
  // Test coordinate pipeline with actual data
  if (pages.length > 0) {
    const firstPage = pages[0]
    console.log('\n=== COORDINATE PIPELINE TEST ===')
    
    // Import and run geometry analysis
    import('./geometryAnalysis.js').then(geom => {
      const testCell = 0
      const calibration = firstPage.autoCalibration || { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 }
      
      const pipeline = geom.simulateCoordinatePipeline(
        firstPage.pageWidth, 
        firstPage.pageHeight, 
        testCell, 
        calibration
      )
      
      console.log('Pipeline result:', pipeline)
    }).catch(err => {
      console.warn('Could not load geometry analysis:', err)
    })
  }
}

// Performance monitoring
function startPerformanceMonitoring() {
  console.log('⏱️  Starting performance monitoring...')
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach(entry => {
      if (entry.name.includes('drawImage') || 
          entry.name.includes('getImageData') ||
          entry.name.includes('putImageData')) {
        console.log(`🔧 Canvas operation: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
      }
    })
  })
  
  observer.observe({ entryTypes: ['measure'] })
  
  // Monitor React renders
  let renderCount = 0
  const originalLog = console.log
  console.log = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
      renderCount++
    }
    originalLog.apply(console, args)
  }
  
  setTimeout(() => {
    console.log(`📊 React renders detected: ${renderCount}`)
  }, 5000)
}

// Overflow analysis
function analyzeOverflowPatterns() {
  console.log('🔍 Analyzing overflow patterns...')
  
  const glyphCards = document.querySelectorAll('.glyph-card')
  const overflowCards = Array.from(glyphCards).filter(card => 
    card.textContent?.includes('Overflow')
  )
  
  console.log(`Found ${overflowCards.length}/${glyphCards.length} overflow cards`)
  
  if (overflowCards.length > 0) {
    const sample = overflowCards.slice(0, 5)
    sample.forEach((card, i) => {
      const img = card.querySelector('img')
      const rect = card.getBoundingClientRect()
      
      console.log(`Overflow ${i + 1}:`, {
        position: { x: rect.left, y: rect.top },
        size: { width: rect.width, height: rect.height },
        hasImage: !!img,
        imageSrc: img?.src?.substring(0, 50) + '...'
      })
    })
  }
}

// Main execution
console.log('🚀 Starting geometry diagnostic...')
analyzeCurrentGeometry()
startPerformanceMonitoring()
setTimeout(analyzeOverflowPatterns, 1000)

console.log('\n📋 Available commands:')
console.log('- analyzeCurrentGeometry() - Re-run geometry analysis')
console.log('- analyzeOverflowPatterns() - Analyze overflow patterns')
console.log('- Performance data is being collected automatically')
