/**
 * Main Vision Engine - Orchestrates all Step 3 vision processing
 * 
 * This is the new core that replaces the old "UI tool" approach
 * with a proper computer vision pipeline for production-quality extraction.
 */

import { PerPageCalibration } from './PerPageCalibration.js'
import { CornerAnchorDetection } from './CornerAnchorDetection.js'
import { SmartCropEngine } from './SmartCropEngine.js'
import { GlyphNormalizer } from './GlyphNormalizer.js'
import { ConfidenceScoring } from './ConfidenceScoring.js'
import { ThaiSpecialHandling } from './ThaiSpecialHandling.js'

export class VisionEngine {
  constructor() {
    // Initialize all vision components
    this.perPageCalibration = new PerPageCalibration()
    this.cornerAnchorDetection = new CornerAnchorDetection()
    this.smartCropEngine = new SmartCropEngine()
    this.glyphNormalizer = new GlyphNormalizer()
    this.confidenceScoring = new ConfidenceScoring()
    this.thaiSpecialHandling = new ThaiSpecialHandling()

    // Processing pipeline configuration
    this.pipelineConfig = {
      enablePerPageCalibration: true,
      enableCornerAnchors: true,
      enableSmartCrop: true,
      enableNormalization: true,
      enableConfidenceScoring: true,
      enableThaiHandling: true,
      
      // Quality thresholds
      minConfidenceThreshold: 0.4,
      maxConfidenceThreshold: 0.95,
      
      // Performance settings
      batchSize: 50,
      enableParallelProcessing: true
    }

    // Statistics tracking
    this.stats = {
      totalPagesProcessed: 0,
      totalGlyphsProcessed: 0,
      averageConfidence: 0,
      processingTime: 0,
      overflowReduction: 0
    }
  }

  /**
   * Main pipeline: Process all pages and extract high-quality glyphs
   */
  async processPages(pages, chars, calibration = {}) {
    const startTime = performance.now()
    
    try {
      // Step 1: Per-page calibration and corner detection
      const calibratedPages = await this.calibrateAllPages(pages, chars)
      
      // Step 2: Extract glyphs using improved grid positioning
      const rawGlyphs = await this.extractGlyphsFromCalibratedPages(calibratedPages, chars, calibration)
      
      // Step 3: Smart crop with ink bounding box detection
      const smartCroppedGlyphs = await this.applySmartCropping(rawGlyphs)
      
      // Step 4: Thai special handling
      const thaiProcessedGlyphs = await this.applyThaiSpecialHandling(smartCroppedGlyphs)
      
      // Step 5: Normalize all glyphs
      const normalizedGlyphs = await this.normalizeAllGlyphs(thaiProcessedGlyphs)
      
      // Step 6: Calculate confidence scores
      const scoredGlyphs = await this.calculateConfidenceScores(normalizedGlyphs)
      
      // Step 7: Generate QA report
      const qaReport = this.generateQAReport(scoredGlyphs)
      
      // Update statistics
      this.updateStats(scoredGlyphs, startTime)
      
      return {
        glyphs: scoredGlyphs,
        qaReport,
        stats: this.stats,
        calibratedPages,
        processingTime: performance.now() - startTime
      }
      
    } catch (error) {
      console.error('Vision Engine processing failed:', error)
      throw new Error(`Vision Engine failed: ${error.message}`)
    }
  }

  /**
   * Step 1: Calibrate all pages individually
   */
  async calibrateAllPages(pages, chars) {
    const calibratedPages = []
    
    for (const page of pages) {
      try {
        // Get page image data
        const imageData = this.extractImageData(page)
        
        // Apply per-page calibration
        if (this.pipelineConfig.enablePerPageCalibration) {
          const pageCalibration = this.perPageCalibration.calibratePage(
            { ...page, imageData },
            this.getExpectedGeometry()
          )
          
          page.pageCalibration = pageCalibration
        }
        
        // Detect corner anchors
        if (this.pipelineConfig.enableCornerAnchors) {
          const cornerDetection = this.cornerAnchorDetection.detectCornerMarkers(
            imageData,
            page.pageWidth,
            page.pageHeight
          )
          
          if (cornerDetection.confidence > 0.5) {
            page.cornerAnchors = cornerDetection.corners
            page.gridMatrix = this.cornerAnchorDetection.buildGridMatrix(6, 6)
          }
        }
        
        calibratedPages.push(page)
        
      } catch (error) {
        console.error(`Failed to calibrate page ${page.pageNumber}:`, error)
        calibratedPages.push(page) // Include original page as fallback
      }
    }
    
    this.stats.totalPagesProcessed = calibratedPages.length
    return calibratedPages
  }

  /**
   * Step 2: Extract glyphs using improved positioning
   */
  async extractGlyphsFromCalibratedPages(calibratedPages, chars, calibration) {
    const allGlyphs = []
    let charIndex = 0
    
    for (const page of calibratedPages) {
      if (charIndex >= chars.length) break
      
      try {
        const pageGlyphs = await this.extractGlyphsFromPage(page, chars.slice(charIndex), calibration)
        allGlyphs.push(...pageGlyphs)
        charIndex += pageGlyphs.length
        
      } catch (error) {
        console.error(`Failed to extract glyphs from page ${page.pageNumber}:`, error)
      }
    }
    
    return allGlyphs
  }

  /**
   * Extract glyphs from a single calibrated page
   */
  async extractGlyphsFromPage(page, pageChars, calibration) {
    const ctx = page.ctx
    const pageWidth = page.pageWidth
    const pageHeight = page.pageHeight
    
    // Guard: page must have a valid canvas context
    if (!ctx || typeof ctx.getImageData !== 'function') {
      console.warn(`Page ${page.pageNumber} has no valid ctx — skipping`)
      return []
    }
    
    const glyphs = []
    
    for (let i = 0; i < pageChars.length; i++) {
      const char = pageChars[i]
      
      try {
        // Calculate cell position using page-specific calibration
        const cellPosition = this.calculateCellPosition(page, i, calibration)
        
        if (!cellPosition) {
          console.warn(`Could not calculate position for glyph ${i} (${char})`)
          continue
        }
        
        // Extract glyph canvas
        const glyphCanvas = this.extractGlyphCanvas(ctx, cellPosition, pageWidth, pageHeight)
        
        glyphs.push({
          id: `p${page.pageNumber}-${i}-${char}`,
          index: i + 1,
          pageNumber: page.pageNumber,
          ch: char,
          canvas: glyphCanvas,
          _inkCanvas: glyphCanvas,
          _inkW: glyphCanvas.width,
          _inkH: glyphCanvas.height,
          cellPosition,
          pageCalibration: page.pageCalibration,
          status: 'extracted'
        })
        
      } catch (error) {
        console.error(`Failed to extract glyph ${i} (${char}):`, error)
        
        glyphs.push({
          id: `p${page.pageNumber}-${i}-${char}`,
          index: i + 1,
          pageNumber: page.pageNumber,
          ch: char,
          status: 'error',
          error: error.message
        })
      }
    }
    
    return glyphs
  }

  /**
   * Calculate cell position using page-specific calibration
   */
  calculateCellPosition(page, index, globalCalibration) {
    const GRID_COLS = 6
    const row = Math.floor(index / GRID_COLS)
    const col = index % GRID_COLS
    
    let x, y, width, height
    
    if (page.gridMatrix && page.cornerAnchors) {
      // Use corner anchor transformation
      const transformedPoint = this.cornerAnchorDetection.transformGridPoint(col, row)
      if (transformedPoint) {
        x = transformedPoint.x
        y = transformedPoint.y
        width = 60  // Approximate cell size from grid
        height = 60
      } else {
        return null
      }
    } else if (page.pageCalibration) {
      // Use per-page calibration
      const baseGeometry = this.getExpectedGeometry()
      const calibrated = this.perPageCalibration.applyPageCalibration(
        baseGeometry.startX + col * (baseGeometry.cellWidth + baseGeometry.gap),
        baseGeometry.startY + row * (baseGeometry.cellHeight + baseGeometry.gap),
        page.pageNumber
      )
      
      x = calibrated.x
      y = calibrated.y
      width = baseGeometry.cellWidth
      height = baseGeometry.cellHeight
    } else {
      // Fallback to global calibration
      const baseGeometry = this.getExpectedGeometry()
      x = baseGeometry.startX + col * (baseGeometry.cellWidth + baseGeometry.gap) + (globalCalibration.offsetX || 0)
      y = baseGeometry.startY + row * (baseGeometry.cellHeight + baseGeometry.gap) + (globalCalibration.offsetY || 0)
      width = baseGeometry.cellWidth + (globalCalibration.cellAdjust || 0)
      height = baseGeometry.cellHeight + (globalCalibration.cellAdjust || 0)
    }
    
    return { x, y, width, height }
  }

  /**
   * Extract glyph canvas from page context
   */
  extractGlyphCanvas(ctx, position, pageWidth, pageHeight) {
    const { x, y, width, height } = position
    
    // Ensure bounds are within page
    const cropX = Math.max(0, Math.min(x, pageWidth - 1))
    const cropY = Math.max(0, Math.min(y, pageHeight - 1))
    const cropWidth = Math.max(20, Math.min(width, pageWidth - cropX))
    const cropHeight = Math.max(20, Math.min(height, pageHeight - cropY))
    
    // Create glyph canvas
    const glyphCanvas = document.createElement('canvas')
    glyphCanvas.width = cropWidth
    glyphCanvas.height = cropHeight
    const glyphCtx = glyphCanvas.getContext('2d')
    
    // Extract image data
    const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight)
    glyphCtx.putImageData(imageData, 0, 0)
    
    return glyphCanvas
  }

  /**
   * Step 3: Apply smart cropping
   */
  async applySmartCropping(glyphs) {
    if (!this.pipelineConfig.enableSmartCrop) {
      return glyphs
    }
    
    const batchSize = this.pipelineConfig.batchSize
    const results = []
    
    for (let i = 0; i < glyphs.length; i += batchSize) {
      const batch = glyphs.slice(i, i + batchSize)
      const batchResult = this.smartCropEngine.batchSmartCrop(batch)
      results.push(...batchResult.results)
    }
    
    return results
  }

  /**
   * Step 4: Apply Thai special handling
   */
  async applyThaiSpecialHandling(glyphs) {
    if (!this.pipelineConfig.enableThaiHandling) {
      return glyphs
    }
    
    const batchSize = this.pipelineConfig.batchSize
    const results = []
    
    for (let i = 0; i < glyphs.length; i += batchSize) {
      const batch = glyphs.slice(i, i + batchSize)
      const batchResult = this.thaiSpecialHandling.batchProcessThai(batch)
      results.push(...batchResult.results)
    }
    
    return results
  }

  /**
   * Step 5: Normalize all glyphs
   */
  async normalizeAllGlyphs(glyphs) {
    if (!this.pipelineConfig.enableNormalization) {
      return glyphs
    }
    
    const batchSize = this.pipelineConfig.batchSize
    const results = []
    
    for (let i = 0; i < glyphs.length; i += batchSize) {
      const batch = glyphs.slice(i, i + batchSize)
      const batchResult = this.glyphNormalizer.batchNormalize(batch)
      results.push(...batchResult.results)
    }
    
    return results
  }

  /**
   * Step 6: Calculate confidence scores
   */
  async calculateConfidenceScores(glyphs) {
    if (!this.pipelineConfig.enableConfidenceScoring) {
      return glyphs.map(glyph => ({
        ...glyph,
        confidence: { overall: 0.5, status: 'unknown' }
      }))
    }
    
    const scoredGlyphs = glyphs.map(glyph => {
      try {
        const confidence = this.confidenceScoring.calculateConfidence(glyph)
        return {
          ...glyph,
          confidence,
          status: this.mapConfidenceToStatus(confidence.overall, glyph.status)
        }
      } catch (error) {
        console.error(`Failed to score glyph ${glyph.id}:`, error)
        return {
          ...glyph,
          confidence: { overall: 0, status: 'error', error: error.message },
          status: 'error'
        }
      }
    })
    
    return scoredGlyphs
  }

  /**
   * Step 7: Generate QA report
   */
  generateQAReport(glyphs) {
    const report = {
      total: glyphs.length,
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0,
      critical: 0,
      overflow: 0,
      missing: 0,
      error: 0,
      averageConfidence: 0,
      issues: [],
      recommendations: []
    }
    
    let totalConfidence = 0
    let confidenceCount = 0
    
    glyphs.forEach(glyph => {
      const status = glyph.status
      const confidence = glyph.confidence?.overall || 0
      
      // Count by status
      switch (status) {
        case 'excellent': report.excellent++; break
        case 'good': report.good++; break
        case 'acceptable': report.acceptable++; break
        case 'poor': report.poor++; break
        case 'critical': report.critical++; break
        case 'overflow': report.overflow++; break
        case 'missing': report.missing++; break
        case 'error': report.error++; break
      }
      
      // Accumulate confidence
      if (confidence > 0) {
        totalConfidence += confidence
        confidenceCount++
      }
      
      // Collect issues
      if (confidence < 0.4 && status !== 'missing' && status !== 'error') {
        report.issues.push({
          id: glyph.id,
          char: glyph.ch,
          issue: 'Low confidence',
          confidence,
          feedback: glyph.confidence?.feedback || []
        })
      }
    })
    
    report.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report)
    
    return report
  }

  /**
   * Map confidence score to status
   */
  mapConfidenceToStatus(confidence, originalStatus) {
    if (originalStatus === 'error' || originalStatus === 'missing') {
      return originalStatus
    }
    
    if (confidence >= 0.9) return 'excellent'
    if (confidence >= 0.75) return 'good'
    if (confidence >= 0.6) return 'acceptable'
    if (confidence >= 0.4) return 'poor'
    return 'critical'
  }

  /**
   * Generate recommendations based on QA report
   */
  generateRecommendations(report) {
    const recommendations = []
    
    if (report.critical > report.total * 0.1) {
      recommendations.push('High number of critical quality issues - consider re-scanning')
    }
    
    if (report.overflow > report.total * 0.2) {
      recommendations.push('Many overflow detections - check grid alignment and page calibration')
    }
    
    if (report.averageConfidence < 0.6) {
      recommendations.push('Low average confidence - improve scan quality or adjust processing parameters')
    }
    
    if (report.poor + report.critical > report.good + report.excellent) {
      recommendations.push('More poor quality than good quality - review extraction pipeline')
    }
    
    return recommendations
  }

  /**
   * Update engine statistics
   */
  updateStats(glyphs, startTime) {
    this.stats.totalGlyphsProcessed = glyphs.length
    this.stats.processingTime = performance.now() - startTime
    
    // Calculate average confidence
    const validGlyphs = glyphs.filter(g => g.confidence?.overall > 0)
    if (validGlyphs.length > 0) {
      this.stats.averageConfidence = validGlyphs.reduce((sum, g) => sum + g.confidence.overall, 0) / validGlyphs.length
    }
    
    // Estimate overflow reduction (compare with old system)
    const overflowCount = glyphs.filter(g => g.status === 'overflow').length
    this.stats.overflowReduction = Math.max(0, (99 - overflowCount) / 99) // Assuming old system had 99 overflows
  }

  /**
   * Utility methods
   */
  extractImageData(page) {
    if (page.imageData) {
      return page.imageData
    }
    
    if (page.ctx) {
      return page.ctx.getImageData(0, 0, page.pageWidth, page.pageHeight)
    }
    
    throw new Error('No image data available for page')
  }

  getExpectedGeometry() {
    // Return expected grid geometry based on template
    return {
      startX: 118,
      startY: 382,
      cellWidth: 244,
      cellHeight: 242,
      gap: 17
    }
  }

  /**
   * Configuration methods
   */
  updateConfig(newConfig) {
    this.pipelineConfig = { ...this.pipelineConfig, ...newConfig }
  }

  getConfig() {
    return { ...this.pipelineConfig }
  }

  getStats() {
    return { ...this.stats }
  }

  reset() {
    this.perPageCalibration.reset()
    this.cornerAnchorDetection.reset()
    this.smartCropEngine.resetThresholds()
    this.glyphNormalizer.setTargetSize(100, 100)
    this.stats = {
      totalPagesProcessed: 0,
      totalGlyphsProcessed: 0,
      averageConfidence: 0,
      processingTime: 0,
      overflowReduction: 0
    }
  }
}