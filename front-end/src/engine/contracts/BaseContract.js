export class BaseContract {
  constructor(name, version, inputSchema, outputSchema, validationRules) {
    this.name = name
    this.version = version
    this.inputSchema = inputSchema
    this.outputSchema = outputSchema
    this.validationRules = validationRules
  }

  validateInput(data) {
    return this._validate(data, this.inputSchema, 'input')
  }

  validateOutput(data) {
    return this._validate(data, this.outputSchema, 'output')
  }

  _validate(data, schema, type) {
    const errors = []
    
    for (const [key, rule] of Object.entries(schema)) {
      if (!rule.required && data[key] === undefined) continue
      if (rule.required && data[key] === undefined) {
        errors.push(`${type}.${key} is required`)
        continue
      }
      
      if (rule.type && typeof data[key] !== rule.type) {
        errors.push(`${type}.${key} must be ${rule.type}, got ${typeof data[key]}`)
      }
      
      if (rule.validator && !rule.validator(data[key])) {
        errors.push(`${type}.${key} validation failed: ${rule.message}`)
      }
    }
    
    return errors.length === 0 ? null : errors
  }
}
