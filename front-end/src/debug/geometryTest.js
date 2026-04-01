/**
 * GEOMETRY TEST - Run in browser console to verify fixes
 */

// Test the geometry calculations
function testGeometry() {
  console.log('🔍 TESTING GEOMETRY FIXES')
  
  // Import constants (run in Step 3 page)
  const { GRID_GEOMETRY, GRID_CONFIG } = window.__GEOMETRY_DATA || {}
  
  if (!GRID_GEOMETRY) {
    console.error('❌ GRID_GEOMETRY not found. Make sure Step 3 is loaded.')
    return
  }
  
  console.log('📐 GRID_GEOMETRY values:')
  console.log('  cellHeightPx:', GRID_GEOMETRY.cellHeightPx, '(should be 339px)')
  console.log('  cellWidthPx:', GRID_GEOMETRY.cellWidthPx, '(should be 260px)')
  console.log('  gapPx:', GRID_GEOMETRY.gapPx, '(should be 21px)')
  console.log('  startX:', GRID_GEOMETRY.startX, '(should be 119px)')
  console.log('  startY:', GRID_GEOMETRY.startY, '(should be 289px)')
  console.log('  insetRatio:', GRID_GEOMETRY.insetRatio, '(should be 0.02)')
  
  // Test cell positioning
  const testCalibration = { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 }
  
  // Simulate getGridGeometry calculation
  const cellWidth = GRID_GEOMETRY.cellWidthPx + testCalibration.cellAdjust
  const cellHeight = GRID_GEOMETRY.cellHeightPx + testCalibration.cellAdjust
  const gap = GRID_GEOMETRY.gapPx + testCalibration.gapAdjust
  const startX = GRID_GEOMETRY.startX + testCalibration.offsetX
  const startY = GRID_GEOMETRY.startY + testCalibration.offsetY
  
  console.log('\n🎯 TEST: First 3 cells positioning:')
  
  for (let i = 0; i < 3; i++) {
    const row = Math.floor(i / 6)
    const col = i % 6
    
    const gridX = startX + col * (cellWidth + gap)
    const gridY = startY + row * (cellHeight + gap)
    const inset = Math.round(Math.min(cellWidth, cellHeight) * GRID_GEOMETRY.insetRatio)
    
    const cropX = gridX + inset
    const cropY = gridY + inset
    const cropW = Math.max(20, Math.round(cellWidth - inset * 2))
    const cropH = Math.max(20, Math.round(cellHeight - inset * 2))
    
    console.log(`\nCell ${i}:`)
    console.log(`  Grid position: x=${gridX}, y=${gridY}, w=${cellWidth}, h=${cellHeight}`)
    console.log(`  Crop position: x=${cropX}, y=${cropY}, w=${cropW}, h=${cropH}`)
    console.log(`  Inset: ${inset}px (${(GRID_GEOMETRY.insetRatio * 100).toFixed(1)}%)`)
    console.log(`  Expected area: ${(cellWidth * cellHeight).toFixed(0)}px²`)
    console.log(`  Actual area: ${(cropW * cropH).toFixed(0)}px²`)
    console.log(`  Area reduction: ${((1 - (cropW * cropH) / (cellWidth * cellHeight)) * 100).toFixed(1)}%`)
  }
  
  // Verify against expected values
  const expectedCellHeight = 339
  const expectedInsetRatio = 0.02
  const expectedInset = Math.round(expectedCellHeight * expectedInsetRatio) // 7px
  
  console.log('\n✅ VERIFICATION:')
  console.log(`  Cell height correct: ${cellHeight === expectedCellHeight ? '✅' : '❌'} (${cellHeight}px vs ${expectedCellHeight}px)`)
  console.log(`  Inset ratio correct: ${GRID_GEOMETRY.insetRatio === expectedInsetRatio ? '✅' : '❌'} (${GRID_GEOMETRY.insetRatio} vs ${expectedInsetRatio})`)
  console.log(`  Inset pixels correct: ${Math.round(cellHeight * GRID_GEOMETRY.insetRatio) === expectedInset ? '✅' : '❌'} (${Math.round(cellHeight * GRID_GEOMETRY.insetRatio)}px vs ${expectedInset}px)`)
  
  // Expected final crop size
  const expectedCropSize = expectedCellHeight - (expectedInset * 2) // 339 - 14 = 325px
  const actualCropSize = Math.max(20, Math.round(cellHeight - Math.round(cellHeight * GRID_GEOMETRY.insetRatio) * 2))
  
  console.log(`  Crop size correct: ${actualCropSize === expectedCropSize ? '✅' : '❌'} (${actualCropSize}px vs ${expectedCropSize}px)`)
  
  console.log('\n🎯 If all checks pass, overflow should be <10%')
  console.log('🎯 If any check fails, geometry is still wrong')
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  // Store geometry data for test access
  window.testGeometry = testGeometry
  console.log('🔧 Geometry test loaded. Run testGeometry() in console to verify fixes.')
}
