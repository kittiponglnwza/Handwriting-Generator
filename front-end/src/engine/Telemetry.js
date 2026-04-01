export class Telemetry {
  static metrics = new Map()
  static observers = new Set()
  
  static measure(name, fn, context = {}) {
    const start = performance.now()
    const startMemory = performance.memory?.usedJSHeapSize || 0
    
    try {
      const result = fn()
      const duration = performance.now() - start
      const endMemory = performance.memory?.usedJSHeapSize || 0
      
      this.recordMetric(name, {
        duration,
        memoryDelta: endMemory - startMemory,
        success: true,
        context,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.recordMetric(name, {
        duration,
        success: false,
        error: error.message,
        context,
        timestamp: Date.now()
      })
      
      throw error
    }
  }
  
  static async measureAsync(name, fn, context = {}) {
    const start = performance.now()
    const startMemory = performance.memory?.usedJSHeapSize || 0
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      const endMemory = performance.memory?.usedJSHeapSize || 0
      
      this.recordMetric(name, {
        duration,
        memoryDelta: endMemory - startMemory,
        success: true,
        context,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.recordMetric(name, {
        duration,
        success: false,
        error: error.message,
        context,
        timestamp: Date.now()
      })
      
      throw error
    }
  }
  
  static recordMetric(name, data) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)
    metrics.push(data)
    
    // Keep only last 100 entries per metric
    if (metrics.length > 100) {
      metrics.shift()
    }
    
    // Notify observers
    this.observers.forEach(observer => {
      try {
        observer(name, data, this.getAggregates(name))
      } catch (error) {
        console.error('Telemetry observer error:', error)
      }
    })
  }
  
  static getAggregates(name) {
    const metrics = this.metrics.get(name) || []
    const recent = metrics.slice(-10) // Last 10 executions
    
    return {
      count: metrics.length,
      avgDuration: recent.reduce((sum, m) => sum + (m.duration || 0), 0) / recent.length,
      successRate: recent.filter(m => m.success).length / recent.length,
      recentMemoryUsage: recent.reduce((sum, m) => sum + (m.memoryDelta || 0), 0),
      lastExecution: recent[recent.length - 1]
    }
  }
  
  static subscribe(observer) {
    this.observers.add(observer)
    return () => this.observers.delete(observer)
  }
  
  static getMetrics() {
    const result = {}
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = this.getAggregates(name)
    }
    return result
  }
}
