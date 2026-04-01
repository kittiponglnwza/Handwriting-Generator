import { ContractManager } from '../../engine/ContractManager.js'
import { GlyphExtractionContract } from '../../engine/contracts/GlyphExtractionContract.js'
import { Telemetry } from '../../engine/Telemetry.js'
import { PerformanceGovernor } from '../../engine/PerformanceGovernor.js'
import { extractGlyphsFromCanvas } from '../../core/rendering/GlyphExtractor.js'
import { traceAllGlyphs } from '../../core/rendering/SvgTracer.js'
import { GeometryService } from '../../core/geometry/GeometryService.js'

export class Step3Controller {
  static async executeGlyphExtraction(pageData, calibration) {
    return Telemetry.measureAsync('glyph.extract', async () => {
      const params = {
        pageWidth: pageData.pageWidth,
        pageHeight: pageData.pageHeight,
        chars: pageData.chars,
        calibration: calibration,
        ctx: pageData.ctx
      }

      // Create glyph jobs for batch processing
      const glyphJobs = pageData.chars.map((ch, i) => ({
        index: i,
        character: ch,
        params: { ...params, charIndex: i }
      }))

      // Process through performance governor
      const results = await PerformanceGovernor.batchProcessor.add(
        glyphJobs,
        this.processGlyphBatch.bind(this)
      )

      return ContractManager.executeStep(
        'GlyphExtraction',
        GlyphExtractionContract,
        params,
        () => results
      )
    }, { glyphCount: pageData.chars.length, pageSize: `${pageData.pageWidth}x${pageData.pageHeight}` })
  }

  static async processGlyphBatch(batch) {
    // Process batch with frame budget awareness
    return batch.map(job => {
      return Telemetry.measure('glyph.batch', () => {
        return this.extractSingleGlyph(job.params)
      }, { glyphIndex: job.index })
    })
  }

  static extractSingleGlyph(params) {
    const geometry = GeometryService.getGridGeometry(params.calibration)
    const cellPosition = GeometryService.calculateCellPosition(params.charIndex, 6, geometry)
    const cropRect = GeometryService.calculateCropRectangle(cellPosition)
    
    // Use existing extractGlyphsFromCanvas logic for single glyph
    return extractGlyphsFromCanvas({
      ...params,
      chars: [params.character]
    })[0]
  }

  static async executeFullPipeline(pageData, calibration) {
    const stateMachine = window.__stateMachine
    if (!stateMachine) {
      throw new Error('State machine not initialized')
    }

    try {
      // Step 1: Calibration
      stateMachine.transition(PipelineStates.CALIBRATING, { pageCount: pageData.pages?.length || 1 })
      
      // Step 2: Extraction
      stateMachine.transition(PipelineStates.EXTRACTING, { glyphCount: pageData.chars.length })
      const extractionResult = await this.executeGlyphExtraction(pageData, calibration)
      
      // Step 3: SVG Tracing
      stateMachine.transition(PipelineStates.TRACING, { 
        glyphCount: extractionResult.glyphs.length,
        extractedCount: extractionResult.glyphs.filter(g => g.status !== 'missing').length
      })
      
      const tracedGlyphs = await Telemetry.measureAsync('svg.trace', async () => {
        return await traceAllGlyphs(extractionResult.glyphs)
      }, { glyphCount: extractionResult.glyphs.length })
      
      // Step 4: Complete
      stateMachine.transition(PipelineStates.DONE, { 
        totalGlyphs: tracedGlyphs.length,
        okGlyphs: tracedGlyphs.filter(g => g.status === 'ok').length,
        overflowGlyphs: tracedGlyphs.filter(g => g.status === 'overflow').length
      })
      
      return tracedGlyphs
    } catch (error) {
      stateMachine.transition(PipelineStates.ERROR, { error: error.message })
      throw error
    }
  }
}
