/**
 * OVERFLOW ROOT CAUSE CLASSIFICATION
 * 
 * Classifies overflow into categories A-F based on geometry analysis
 */

import { GRID_CONFIG } from '../lib/step3/constants.js'
import { getGridGeometry, classifyGlyph } from '../lib/step3/glyphPipeline.js'

// CSS Grid constants (from Step1.jsx analysis)
const CSS_CONSTANTS = {
  A4_WIDTH_PX: 1785,        // 210mm × 3 (PDF.js scale)
  A4_HEIGHT_PX: 2526,       // 297mm × 3
  MARGIN_PX: 119,           // 14mm × 3
  HEADER_PX: 169,            // ~20mm × 3  
  CELL_HEIGHT_PX: 339,      // 28.5mm × 3 (fixed from CSS)
  GAP_PX: 21,               // 7px × 3
  GRID_COLS: 6
}

// Calculate expected CSS cell position
function getCssCellPosition(cellIndex) {
  const row = Math.floor(cellIndex / CSS_CONSTANTS.GRID_COLS)
  const col = cellIndex % CSS_CONSTANTS.GRID_COLS
  
  return {
    x: CSS_CONSTANTS.MARGIN_PX + col * (CSS_CONSTANTS.CELL_HEIGHT_PX + CSS_CONSTANTS.GAP_PX),
    y: CSS_CONSTANTS.MARGIN_PX + CSS_CONSTANTS.HEADER_PX + row * (CSS_CONSTANTS.CELL_HEIGHT_PX + CSS_CONSTANTS.GAP_PX),
    width: CSS_CONSTANTS.CELL_HEIGHT_PX,
    height: CSS_CONSTANTS.CELL_HEIGHT_PX
  }
}

// Calculate actual crop rectangle from pipeline
function getActualCropRectangle(pageWidth, pageHeight, cellIndex, calibration) {
  const gridGeom = getGridGeometry(pageWidth, pageHeight, cellIndex + 1, calibration)
  const row = Math.floor(cellIndex / CSS_CONSTANTS.GRID_COLS)
  const col = cellIndex % CSS_CONSTANTS.GRID_COLS
  
  const inset = Math.round(gridGeom.cellSize * GRID_CONFIG.insetRatio)
  const cropX = Math.round(gridGeom.startX + col * (gridGeom.cellSize + gridGeom.gap)) + inset
  const cropY = Math.round(gridGeom.startY + row * (gridGeom.cellSize + gridGeom.gap)) + inset
  const cropW = Math.max(20, Math.round(gridGeom.cellSize - inset * 2))
  const cropH = Math.max(20, Math.round(gridGeom.cellSize - inset * 2))
  
  return { x: cropX, y: cropY, width: cropW, height: cropH }
}

// Classify overflow root cause for a single cell
function classifyCellOverflow(cellIndex, pageWidth, pageHeight, calibration, inkBounds) {
  const cssExpected = getCssCellPosition(cellIndex)
  const actualCrop = getActualCropRectangle(pageWidth, pageHeight, cellIndex, calibration)
  
  // Calculate deltas
  const deltas = {
    x: actualCrop.x - cssExpected.x,
    y: actualCrop.y - cssExpected.y,
    width: cssExpected.width - actualCrop.width,  // Positive = crop is smaller
    height: cssExpected.height - actualCrop.height
  }
  
  // Calculate ink overflow relative to crop
  const inkOverflow = {
    left: Math.max(0, actualCrop.x - inkBounds.x),
    top: Math.max(0, actualCrop.y - inkBounds.y),
    right: Math.max(0, (inkBounds.x + inkBounds.width) - (actualCrop.x + actualCrop.width)),
    bottom: Math.max(0, (inkBounds.y + inkBounds.height) - (actualCrop.y + actualCrop.height))
  }
  
  // Classification logic
  const causes = []
  
  // (A) Grid misalignment - significant X/Y offset
  if (Math.abs(deltas.x) > 10 || Math.abs(deltas.y) > 10) {
    causes.push({
      type: 'A',
      description: 'Grid misalignment',
      severity: Math.max(Math.abs(deltas.x), Math.abs(deltas.y)),
      details: `Offset: X=${deltas.x}px, Y=${deltas.y}px`
    })
  }
  
  // (B) Wrong cell size - significant size reduction
  if (deltas.width > 50 || deltas.height > 50) {
    causes.push({
      type: 'B', 
      description: 'Wrong cell size',
      severity: Math.max(deltas.width, deltas.height),
      details: `Size reduction: W=${deltas.width}px, H=${deltas.height}px`
    })
  }
  
  // (C) Incorrect scaling - proportional size mismatch
  const scaleRatio = actualCrop.width / cssExpected.width
  if (scaleRatio < 0.7 || scaleRatio > 1.3) {
    causes.push({
      type: 'C',
      description: 'Incorrect scaling', 
      severity: Math.abs(1 - scaleRatio) * 100,
      details: `Scale ratio: ${scaleRatio.toFixed(2)}`
    })
  }
  
  // (D) SVG trace padding - ink extends beyond crop but within expected bounds
  if (inkOverflow.left > 5 || inkOverflow.top > 5 || inkOverflow.right > 5 || inkOverflow.bottom > 5) {
    const totalInkOverflow = inkOverflow.left + inkOverflow.top + inkOverflow.right + inkOverflow.bottom
    const isInkWithinExpected = 
      inkBounds.x >= cssExpected.x - 5 &&
      inkBounds.y >= cssExpected.y - 5 &&
      inkBounds.x + inkBounds.width <= cssExpected.x + cssExpected.width + 5 &&
      inkBounds.y + inkBounds.height <= cssExpected.y + cssExpected.height + 5
      
    if (isInkWithinExpected) {
      causes.push({
        type: 'D',
        description: 'SVG trace padding issue',
        severity: totalInkOverflow,
        details: `Ink overflow: L=${inkOverflow.left}, T=${inkOverflow.top}, R=${inkOverflow.right}, B=${inkOverflow.bottom}`
      })
    }
  }
  
  // (E) Double render scale - crop area much smaller than expected
  if (scaleRatio < 0.5) {
    causes.push({
      type: 'E',
      description: 'Double render scale',
      severity: (1 - scaleRatio) * 100,
      details: `Extreme size reduction: ${scaleRatio.toFixed(2)}`
    })
  }
  
  // (F) Async race condition - inconsistent results between runs
  // This would need to be detected across multiple runs
  
  return {
    cellIndex,
    cssExpected,
    actualCrop,
    deltas,
    inkOverflow,
    causes,
    primaryCause: causes.length > 0 ? causes.reduce((prev, curr) => prev.severity > curr.severity ? prev : curr) : null
  }
}

// Analyze multiple cells and generate statistics
function analyzeOverflowPatterns(glyphs, pageWidth, pageHeight, calibration) {
  console.log('🔍 OVERFLOW ROOT CAUSE ANALYSIS')
  
  const analysis = glyphs.map((glyph, index) => {
    // Simulate ink bounds (in real scenario, this would be detected from image)
    const inkBounds = {
      x: 0, y: 0,  // Would be actual ink bounding box
      width: 50,   // Would be actual ink dimensions  
      height: 50   // Would be actual ink dimensions
    }
    
    return classifyCellOverflow(index, pageWidth, pageHeight, calibration, inkBounds)
  })
  
  // Generate statistics
  const causeStats = {}
  const overflowGlyphs = analysis.filter(a => a.causes.length > 0)
  
  overflowGlyphs.forEach(analysis => {
    analysis.causes.forEach(cause => {
      causeStats[cause.type] = (causeStats[cause.type] || 0) + 1
    })
  })
  
  const totalAnalyzed = analysis.length
  const totalOverflows = overflowGlyphs.length
  const overflowRate = (totalOverflows / totalAnalyzed * 100).toFixed(1)
  
  console.log(`\n📊 OVERFLOW STATISTICS:`)
  console.log(`Total analyzed: ${totalAnalyzed}`)
  console.log(`Total overflows: ${totalOverflows} (${overflowRate}%)`)
  console.log(`\nRoot cause distribution:`)
  
  Object.entries(causeStats).forEach(([type, count]) => {
    const percentage = (count / totalOverflows * 100).toFixed(1)
    console.log(`  ${type}: ${count} (${percentage}%)`)
  })
  
  // Show detailed examples for each cause type
  const causeExamples = {}
  overflowGlyphs.forEach(analysis => {
    analysis.causes.forEach(cause => {
      if (!causeExamples[cause.type]) {
        causeExamples[cause.type] = analysis
      }
    })
  })
  
  console.log(`\n🔍 DETAILED EXAMPLES:`)
  Object.entries(causeExamples).forEach(([type, example]) => {
    console.log(`\n${type}: ${example.primaryCause.description}`)
    console.log(`  Cell ${example.cellIndex}: ${example.primaryCause.details}`)
    console.log(`  CSS expected: ${example.cssExpected.width}×${example.cssExpected.height}px`)
    console.log(`  Actual crop: ${example.actualCrop.width}×${example.actualCrop.height}px`)
    console.log(`  Size reduction: ${example.deltas.width}×${example.deltas.height}px`)
  })
  
  return {
    totalAnalyzed,
    totalOverflows,
    overflowRate,
    causeStats,
    causeExamples,
    detailedAnalysis: analysis
  }
}

// Test with typical scenario
function runOverflowAnalysis() {
  // Simulate typical page data
  const pageWidth = CSS_CONSTANTS.A4_WIDTH_PX
  const pageHeight = CSS_CONSTANTS.A4_HEIGHT_PX
  const calibration = { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 }
  
  // Simulate glyphs (in real scenario, these come from Step 3)
  const simulatedGlyphs = Array.from({ length: 36 }, (_, i) => ({
    id: `cell-${i}`,
    status: i % 4 === 0 ? 'overflow' : 'ok',  // Simulate some overflows
    index: i + 1
  }))
  
  return analyzeOverflowPatterns(simulatedGlyphs, pageWidth, pageHeight, calibration)
}

export {
  classifyCellOverflow,
  analyzeOverflowPatterns,
  runOverflowAnalysis,
  CSS_CONSTANTS
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  runOverflowAnalysis()
}
