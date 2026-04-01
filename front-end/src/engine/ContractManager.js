import { GeometryError, PipelineError } from './errors/BaseError.js'

export class ContractManager {
  static contracts = new Map()
  
  static register(contract) {
    this.contracts.set(contract.name, contract)
  }
  
  static async executeStep(stepName, contract, inputData, processor) {
    // Validate input
    const inputErrors = contract.validateInput(inputData)
    if (inputErrors) {
      throw new PipelineError(`${stepName} input validation failed: ${inputErrors.join(', ')}`, stepName, { errors: inputErrors })
    }
    
    // Execute step
    let output
    try {
      output = await processor(inputData)
    } catch (error) {
      throw new PipelineError(`${stepName} execution failed: ${error.message}`, stepName, { originalError: error })
    }
    
    // Validate output
    const outputErrors = contract.validateOutput(output)
    if (outputErrors) {
      throw new PipelineError(`${stepName} output validation failed: ${outputErrors.join(', ')}`, stepName, { errors: outputErrors })
    }
    
    // Run business rules
    for (const [ruleName, rule] of Object.entries(contract.validationRules)) {
      try {
        if (!rule(inputData, output)) {
          throw new PipelineError(`${stepName} business rule failed: ${ruleName}`, stepName, { rule: ruleName })
        }
      } catch (error) {
        if (error instanceof GeometryError) {
          throw error // Re-throw geometry errors
        }
        throw new PipelineError(`${stepName} rule execution failed: ${ruleName}`, stepName, { rule: ruleName, error })
      }
    }
    
    return output
  }
}
