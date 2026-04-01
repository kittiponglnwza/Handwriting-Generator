export class BaseError extends Error {
  constructor(message, code, context = {}) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.context = context
    this.timestamp = Date.now()
  }
}

export class GeometryError extends BaseError {
  constructor(message, context) {
    super(message, 'GEOMETRY_ERROR', context)
  }
}

export class PipelineError extends BaseError {
  constructor(message, stepName, context) {
    super(message, 'PIPELINE_ERROR', { stepName, ...context })
  }
}

export class RenderingError extends BaseError {
  constructor(message, renderingContext, context) {
    super(message, 'RENDERING_ERROR', { renderingContext, ...context })
  }
}

export class CalibrationError extends BaseError {
  constructor(message, calibrationData, context) {
    super(message, 'CALIBRATION_ERROR', { calibrationData, ...context })
  }
}
