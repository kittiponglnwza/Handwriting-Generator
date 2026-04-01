/**
 * GEOMETRY PIPELINE ANALYSIS
 * 
 * This script traces the complete coordinate flow:
 * CSS Grid → GRID_CONFIG → pixel conversion → calibration → cropRect → canvas
 */

import { GRID_CONFIG } from '../lib/step3/constants.js'
import { getGridGeometry } from '../lib/step3/glyphPipeline.js'

// From Step1.jsx - CSS Grid definition:
const CSS_GRID_SPEC = {
  page: { size: 'A4', margin: '14mm' },  // 210×297mm, 14mm margin
  grid: {
    columns: 6,
    gap: '7px',
    cellHeight: '28.5mm'
  }
}

// PDF.js rendering scale (from Step2/Step3 comments)
const PDF_RENDER_SCALE = 3  // scale=3 in PDF.js

// A4 dimensions in different units
const A4_MM = { width: 210, height: 297 }
const A4_PT = { width: 595, height: 842 }  // 72pt = 25.4mm
const A4_PX_SCALED = { width: 1785, height: 2526 }  // ×3

// Convert mm to pixels at PDF.js scale
function mmToPx(mm, scale = PDF_RENDER_SCALE) {
  return Math.round(mm * 72 / 25.4 * scale)
}

// Calculate expected grid geometry from CSS
function calculateCssGridGeometry() {
  const pageWidthPx = A4_PX_SCALED.width
  const pageHeightPx = A4_PX_SCALED.height
  const marginPx = mmToPx(14)  // 14mm margin
  
  // From Step1: gap:7px → at scale=3 = 21px
  const gapPx = 7 * PDF_RENDER_SCALE
  
  // Cell height: 28.5mm → pixels
  const cellHeightPx = mmToPx(28.5)
  
  // Available width for grid (excluding margins)
  const gridWidthPx = pageWidthPx - (marginPx * 2)
  
  // Cell width from CSS grid (6 columns with gaps)
  const cellWidthPx = (gridWidthPx - (gapPx * 5)) / 6
  
  return {
    pageWidth: pageWidthPx,
    pageHeight: pageHeightPx,
    margin: marginPx,
    startX: marginPx,
    startY: marginPx + mmToPx(20),  // header ~20mm from margin
    cellWidth: cellWidthPx,
    cellHeight: cellHeightPx,
    gap: gapPx,
    // Calculate GRID_CONFIG ratios for verification
    computedRatios: {
      padXRatio: marginPx / pageWidthPx,
      topRatio: (marginPx + mmToPx(20)) / pageHeightPx,
      gapRatio: gapPx / pageWidthPx,
      insetRatio: 0.06  // from GRID_CONFIG
    }
  }
}

// Verify GRID_CONFIG matches CSS
function verifyGridConfig() {
  const cssGeom = calculateCssGridGeometry()
  const gridConfig = GRID_CONFIG
  
  console.log('=== GEOMETRY VERIFICATION ===')
  console.log('CSS Grid Geometry:', cssGeom)
  console.log('GRID_CONFIG:', gridConfig)
  console.log()
  
  const checks = [
    {
      name: 'padXRatio',
      expected: cssGeom.computedRatios.padXRatio,
      actual: gridConfig.padXRatio,
      tolerance: 0.001
    },
    {
      name: 'topRatio', 
      expected: cssGeom.computedRatios.topRatio,
      actual: gridConfig.topRatio,
      tolerance: 0.001
    },
    {
      name: 'gapRatio',
      expected: cssGeom.computedRatios.gapRatio,
      actual: gridConfig.gapRatio,
      tolerance: 0.001
    }
  ]
  
  console.log('GRID_CONFIG Verification:')
  checks.forEach(check => {
    const diff = Math.abs(check.expected - check.actual)
    const status = diff <= check.tolerance ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${check.name}: expected=${check.expected.toFixed(4)}, actual=${check.actual.toFixed(4)}, diff=${diff.toFixed(4)} ${status}`)
  })
  
  return cssGeom
}

// Simulate full coordinate pipeline for a test cell
function simulateCoordinatePipeline(pageWidth, pageHeight, cellIndex, calibration = { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 }) {
  console.log(`\n=== COORDINATE PIPELINE FOR CELL ${cellIndex} ===`)
  
  // 1. CSS Grid expected position
  const cssGeom = calculateCssGridGeometry()
  const row = Math.floor(cellIndex / 6)
  const col = cellIndex % 6
  
  const cssExpected = {
    x: cssGeom.startX + col * (cssGeom.cellWidth + cssGeom.gap),
    y: cssGeom.startY + row * (cssGeom.cellHeight + cssGeom.gap),
    width: cssGeom.cellWidth,
    height: cssGeom.cellHeight
  }
  
  console.log('1. CSS Grid Expected:', cssExpected)
  
  // 2. GRID_CONFIG calculation
  const gridGeom = getGridGeometry(pageWidth, pageHeight, cellIndex + 1, calibration)
  console.log('2. getGridGeometry():', gridGeom)
  
  // 3. Final crop rectangle (from glyphPipeline.js extractGlyphsFromCanvas)
  const inset = Math.round(gridGeom.cellSize * GRID_CONFIG.insetRatio)
  const finalCrop = {
    x: Math.round(gridGeom.startX + col * (gridGeom.cellSize + gridGeom.gap)) + inset,
    y: Math.round(gridGeom.startY + row * (gridGeom.cellSize + gridGeom.gap)) + inset,
    width: Math.max(20, Math.round(gridGeom.cellSize - inset * 2)),
    height: Math.max(20, Math.round(gridGeom.cellSize - inset * 2))
  }
  
  console.log('3. Final Crop Rectangle:', finalCrop)
  
  // 4. Calculate deltas
  const deltas = {
    x: finalCrop.x - cssExpected.x,
    y: finalCrop.y - cssExpected.y,
    width: finalCrop.width - cssExpected.width,
    height: finalCrop.height - cssExpected.height
  }
  
  console.log('4. Deltas (CSS → Final):', deltas)
  
  // 5. Check for potential issues
  const issues = []
  if (Math.abs(deltas.x) > 5) issues.push(`X offset large: ${deltas.x}px`)
  if (Math.abs(deltas.y) > 5) issues.push(`Y offset large: ${deltas.y}px`)
  if (Math.abs(deltas.width) > 10) issues.push(`Width diff large: ${deltas.width}px`)
  if (Math.abs(deltas.height) > 10) issues.push(`Height diff large: ${deltas.height}px`)
  
  if (issues.length > 0) {
    console.log('⚠️  POTENTIAL ISSUES:', issues)
  } else {
    console.log('✅ Coordinate pipeline looks correct')
  }
  
  return { cssExpected, gridGeom, finalCrop, deltas, issues }
}

// DPI and scale analysis
function analyzeScaleFactors() {
  console.log('\n=== SCALE FACTOR ANALYSIS ===')
  
  const cssGeom = calculateCssGridGeometry()
  
  console.log('Physical dimensions:')
  console.log(`  A4: ${A4_MM.width}×${A4_MM.height}mm`)
  console.log(`  PDF.js scale=${PDF_RENDER_SCALE}: ${A4_PX_SCALED.width}×${A4_PX_SCALED.height}px`)
  
  console.log('\nCell dimensions:')
  console.log(`  CSS: ${cssGeom.cellWidth.toFixed(1)}×${cssGeom.cellHeight.toFixed(1)}px`)
  console.log(`  Physical: ${(cssGeom.cellWidth / PDF_RENDER_SCALE * 25.4 / 72).toFixed(2)}×${(cssGeom.cellHeight / PDF_RENDER_SCALE * 25.4 / 72).toFixed(2)}mm`)
  
  // Check for devicePixelRatio issues
  console.log(`\nDevice considerations:`)
  console.log(`  devicePixelRatio: ${window.devicePixelRatio || 1}`)
  console.log(`  Canvas scaling may be needed for retina displays`)
}

export {
  calculateCssGridGeometry,
  verifyGridConfig,
  simulateCoordinatePipeline,
  analyzeScaleFactors
}

// Auto-run analysis if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('🔍 GEOMETRY PIPELINE ANALYSIS')
  verifyGridConfig()
  analyzeScaleFactors()
  
  // Test with typical page dimensions
  simulateCoordinatePipeline(1785, 2526, 0)  // First cell
  simulateCoordinatePipeline(1785, 2526, 17) // Middle cell
  simulateCoordinatePipeline(1785, 2526, 35) // Last cell
}
