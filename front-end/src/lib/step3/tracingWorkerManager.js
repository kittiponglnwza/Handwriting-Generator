/**
 * WEB WORKER MANAGER FOR SVG TRACING
 * 
 * Manages worker pool and batch processing for SVG tracing
 */

class TracingWorkerManager {
  constructor() {
    this.workers = []
    this.workerPool = []
    this.busyWorkers = new Set()
    this.pendingTasks = new Map()
    this.taskId = 0
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return
    
    try {
      // Create worker pool (2 workers for parallel processing)
      const workerCount = Math.min(2, navigator.hardwareConcurrency || 2)
      
      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker('./workers/tracingWorker.js')
        
        worker.onmessage = (e) => {
          this.handleWorkerMessage(worker, e.data)
        }
        
        worker.onerror = (error) => {
          console.error('Worker error:', error)
          this.busyWorkers.delete(worker)
        }
        
        this.workerPool.push(worker)
      }
      
      // Wait for workers to be ready
      await Promise.all(
        this.workerPool.map(worker => 
          new Promise(resolve => {
            const handler = (e) => {
              if (e.data.type === 'WORKER_READY') {
                worker.removeEventListener('message', handler)
                resolve()
              }
            }
            worker.addEventListener('message', handler)
          })
        )
      )
      
      this.isInitialized = true
      console.log(`✅ Tracing worker manager initialized with ${workerCount} workers`)
    } catch (error) {
      console.warn('Failed to initialize tracing workers, falling back to main thread:', error)
      this.isInitialized = false
    }
  }

  handleWorkerMessage(worker, message) {
    const { type, payload } = message
    
    switch (type) {
      case 'TRACE_COMPLETE':
      case 'BATCH_COMPLETE':
        const task = this.pendingTasks.get(payload.taskId || payload.results[0]?.glyphId)
        if (task) {
          task.resolve(payload)
          this.pendingTasks.delete(payload.taskId || payload.results[0]?.glyphId)
        }
        this.busyWorkers.delete(worker)
        this.processQueue()
        break
        
      case 'TRACE_ERROR':
      case 'BATCH_ERROR':
        const errorTask = this.pendingTasks.get(payload.taskId || 'batch')
        if (errorTask) {
          errorTask.reject(new Error(payload.error))
          this.pendingTasks.delete(payload.taskId || 'batch')
        }
        this.busyWorkers.delete(worker)
        this.processQueue()
        break
    }
  }

  getAvailableWorker() {
    return this.workerPool.find(worker => !this.busyWorkers.has(worker))
  }

  processQueue() {
    // Process any pending tasks if workers are available
    // This is a simplified queue - in production you'd want a proper priority queue
  }

  async traceGlyph(imageData, width, height, glyphId) {
    if (!this.isInitialized) {
      // Fallback to main thread
      return this.traceGlyphMain(imageData, width, height, glyphId)
    }

    const worker = this.getAvailableWorker()
    if (!worker) {
      // Wait for available worker
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.getAvailableWorker()) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 10)
      })
      return this.traceGlyph(imageData, width, height, glyphId)
    }

    this.busyWorkers.add(worker)
    const taskId = `glyph_${this.taskId++}`
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve, reject })
      
      worker.postMessage({
        type: 'TRACE_GLYPH',
        payload: { imageData, width, height, glyphId, taskId }
      })
    })
  }

  async traceGlyphBatch(glyphs) {
    if (!this.isInitialized) {
      // Fallback to main thread
      return this.traceGlyphBatchMain(glyphs)
    }

    // Process in parallel using available workers
    const batchSize = Math.ceil(glyphs.length / this.workerPool.length)
    const batches = []
    
    for (let i = 0; i < glyphs.length; i += batchSize) {
      batches.push(glyphs.slice(i, i + batchSize))
    }

    const batchResults = await Promise.all(
      batches.map(async (batch, batchIndex) => {
        const worker = this.getAvailableWorker()
        if (!worker) {
          // Wait for available worker
          await new Promise(resolve => {
            const checkInterval = setInterval(() => {
              if (this.getAvailableWorker()) {
                clearInterval(checkInterval)
                resolve()
              }
            }, 10)
          })
          return this.traceGlyphBatch(batch)
        }

        this.busyWorkers.add(worker)
        const taskId = `batch_${this.taskId++}`
        
        return new Promise((resolve, reject) => {
          this.pendingTasks.set(taskId, { resolve, reject })
          
          worker.postMessage({
            type: 'TRACE_BATCH',
            payload: { 
              glyphs: batch.map(g => ({
                id: g.id,
                imageData: g._imageData,
                width: g._inkW,
                height: g._inkH
              })),
              taskId 
            }
          })
        })
      })
    )

    // Flatten batch results
    return batchResults.flatMap(batch => batch.payload.results)
  }

  // Fallback methods for when workers are not available
  async traceGlyphMain(imageData, width, height, glyphId) {
    // Import the main thread tracing function
    const { traceToSVGPath } = await import('./glyphPipeline_fixed.js')
    
    return new Promise(resolve => {
      setTimeout(() => {
        const result = traceToSVGPath({ data: imageData }, width, height)
        resolve({
          glyphId,
          result: result || { path: null, viewBox: "0 0 100 100" }
        })
      }, 0)
    })
  }

  async traceGlyphBatchMain(glyphs) {
    const { traceToSVGPath } = await import('./glyphPipeline_fixed.js')
    
    return Promise.all(
      glyphs.map(async (glyph, index) => {
        // Get image data from canvas
        const imageData = glyph._inkCanvas.getContext('2d').getImageData(0, 0, glyph._inkW, glyph._inkH)
        const result = traceToSVGPath(imageData, glyph._inkW, glyph._inkH)
        
        return {
          glyphId: glyph.id,
          result: result || { path: null, viewBox: "0 0 100 100" }
        }
      })
    )
  }

  terminate() {
    this.workerPool.forEach(worker => worker.terminate())
    this.workerPool = []
    this.busyWorkers.clear()
    this.pendingTasks.clear()
    this.isInitialized = false
  }
}

// Singleton instance
const tracingWorkerManager = new TracingWorkerManager()

export default tracingWorkerManager
