/**
 * RUNTIME INTEGRATION TEST
 * 
 * Run this script in browser console to test the new engine integration
 */

function testEngineIntegration() {
  console.log('🧪 TESTING ENGINE INTEGRATION')
  
  // Test 1: Contract System
  console.log('\n📋 1. Testing Contract System')
  try {
    const { GlyphExtractionContract } = window.__ENGINE_CONTRACTS || {}
    const { ContractManager } = window.__ENGINE_CONTRACT_MANAGER || {}
    
    if (!GlyphExtractionContract) {
      console.error('❌ GlyphExtractionContract not found')
    } else {
      console.log('✅ GlyphExtractionContract loaded')
      
      // Test validation
      const validInput = {
        pageWidth: 1785,
        pageHeight: 2526,
        chars: ['A', 'B', 'C'],
        calibration: { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 },
        ctx: { getImageData: () => {} }
      }
      
      const inputErrors = GlyphExtractionContract.validateInput(validInput)
      console.log('Input validation:', inputErrors || '✅ PASSED')
      
      const invalidInput = {
        pageWidth: 1785,
        pageHeight: 2526,
        chars: [], // Missing required field
        calibration: { offsetX: 0, offsetY: 0, cellAdjust: 0, gapAdjust: 0 },
        ctx: { getImageData: () => {} }
      }
      
      const invalidErrors = GlyphExtractionContract.validateInput(invalidInput)
      console.log('Invalid input validation:', invalidErrors ? '✅ FAILED (expected)' : '❌ PASSED (unexpected)')
    }
  } catch (error) {
    console.error('❌ Contract system test failed:', error)
  }
  
  // Test 2: Telemetry System
  console.log('\n📊 2. Testing Telemetry System')
  try {
    const { Telemetry } = window.__ENGINE_TELEMETRY || {}
    
    if (!Telemetry) {
      console.error('❌ Telemetry not found')
    } else {
      console.log('✅ Telemetry loaded')
      
      // Test measurement
      const testResult = Telemetry.measure('test-operation', () => {
        // Simulate some work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += Math.random()
        }
        return sum
      }, { iterations: 1000 })
      
      console.log('Test operation result:', testResult)
      
      // Test metrics retrieval
      const metrics = Telemetry.getMetrics()
      console.log('Available metrics:', metrics)
      
      // Test subscription
      const unsubscribe = Telemetry.subscribe((name, data, aggregates) => {
        console.log(`Telemetry update: ${name}`, { data, aggregates })
      })
      
      // Trigger another measurement
      Telemetry.measure('test-operation-2', () => Math.random() * 100)
      
      // Cleanup
      setTimeout(() => {
        unsubscribe()
        console.log('✅ Telemetry subscription test completed')
      }, 100)
    }
  } catch (error) {
    console.error('❌ Telemetry test failed:', error)
  }
  
  // Test 3: Performance Governor
  console.log('\n⚡ 3. Testing Performance Governor')
  try {
    const { PerformanceGovernor } = window.__ENGINE_PERFORMANCE_GOVERNOR || {}
    
    if (!PerformanceGovernor) {
      console.error('❌ PerformanceGovernor not found')
    } else {
      console.log('✅ PerformanceGovernor loaded')
      console.log('Config:', PerformanceGovernor.config)
      
      // Test batch processing
      const testJobs = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        data: `test-data-${i}`
      }))
      
      const startTime = performance.now()
      
      PerformanceGovernor.batchProcessor.add(testJobs, async (batch) => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10))
        return batch.map(job => ({ ...job, processed: true }))
      }).then(() => {
        const endTime = performance.now()
        console.log(`✅ Batch processing completed in ${endTime - startTime}ms`)
      })
    }
  } catch (error) {
    console.error('❌ Performance Governor test failed:', error)
  }
  
  // Test 4: State Machine
  console.log('\n🔄 4. Testing State Machine')
  try {
    const { PipelineStateMachine, PipelineStates } = window.__ENGINE_STATE_MACHINE || {}
    
    if (!PipelineStateMachine) {
      console.error('❌ PipelineStateMachine not found')
    } else {
      console.log('✅ PipelineStateMachine loaded')
      console.log('Available states:', PipelineStates)
      
      const stateMachine = new PipelineStateMachine()
      console.log('Initial state:', stateMachine.getCurrentState())
      
      // Test transitions
      stateMachine.transition(PipelineStates.CALIBRATING, { test: 'data' })
      console.log('After CALIBRATING:', stateMachine.getCurrentState())
      
      stateMachine.transition(PipelineStates.EXTRACTING, { test: 'more-data' })
      console.log('After EXTRACTING:', stateMachine.getCurrentState())
      
      stateMachine.transition(PipelineStates.DONE, { test: 'final-data' })
      console.log('After DONE:', stateMachine.getCurrentState())
      
      // Test subscription
      const unsubscribe = stateMachine.subscribe({
        onStateChange: (newState, oldState, context) => {
          console.log(`State transition: ${oldState} → ${newState}`, context)
        }
      })
      
      // Test another transition
      stateMachine.transition(PipelineStates.ERROR, { error: 'test error' })
      console.log('After ERROR:', stateMachine.getCurrentState())
      
      unsubscribe()
      console.log('✅ State machine test completed')
    }
  } catch (error) {
    console.error('❌ State machine test failed:', error)
  }
  
  // Test 5: Geometry Service
  console.log('\n📐 5. Testing Geometry Service')
  try {
    const { GeometryService } = window.__ENGINE_GEOMETRY_SERVICE || {}
    
    if (!GeometryService) {
      console.error('❌ GeometryService not found')
    } else {
      console.log('✅ GeometryService loaded')
      console.log('GRID_GEOMETRY:', GeometryService.GRID_GEOMETRY)
      
      // Test geometry calculation
      const geometry = GeometryService.getGridGeometry({ offsetX: 5, offsetY: 3 })
      console.log('Geometry with offset:', geometry)
      
      // Test cell position calculation
      const cellPos = GeometryService.calculateCellPosition(0, 6, geometry)
      console.log('Cell 0 position:', cellPos)
      
      // Test crop rectangle
      const cropRect = GeometryService.calculateCropRectangle(cellPos)
      console.log('Crop rectangle:', cropRect)
      
      // Test validation
      const errors = GeometryService.validateGeometry(geometry)
      console.log('Geometry validation:', errors || '✅ PASSED')
    }
  } catch (error) {
    console.error('❌ Geometry service test failed:', error)
  }
  
  console.log('\n🎯 INTEGRATION TEST COMPLETE')
  console.log('If all tests pass, the runtime integration is working correctly!')
}

// Auto-load engine components if available
function loadEngineComponents() {
  try {
    // Try to import contract system
    import('../engine/contracts/GlyphExtractionContract.js').then(module => {
      window.__ENGINE_CONTRACTS = { GlyphExtractionContract: module.GlyphExtractionContract }
    })
    
    // Try to import contract manager
    import('../engine/ContractManager.js').then(module => {
      window.__ENGINE_CONTRACT_MANAGER = { ContractManager: module.ContractManager }
    })
    
    // Try to import telemetry
    import('../engine/Telemetry.js').then(module => {
      window.__ENGINE_TELEMETRY = { Telemetry: module.Telemetry }
    })
    
    // Try to import performance governor
    import('../engine/PerformanceGovernor.js').then(module => {
      window.__ENGINE_PERFORMANCE_GOVERNOR = { PerformanceGovernor: module.PerformanceGovernor }
    })
    
    // Try to import state machine
    import('../engine/PipelineStateMachine.js').then(module => {
      window.__ENGINE_STATE_MACHINE = { 
        PipelineStateMachine: module.PipelineStateMachine, 
        PipelineStates: module.PipelineStates 
      }
    })
    
    // Try to import geometry service
    import('../core/geometry/GeometryService.js').then(module => {
      window.__ENGINE_GEOMETRY_SERVICE = { GeometryService: module.GeometryService }
    })
    
    console.log('✅ Engine components loaded')
    return true
  } catch (error) {
    console.error('❌ Failed to load engine components:', error)
    return false
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.testEngineIntegration = testEngineIntegration
  window.loadEngineComponents = loadEngineComponents
  
  console.log('🔧 Integration test loaded. Run testEngineIntegration() to test.')
}
