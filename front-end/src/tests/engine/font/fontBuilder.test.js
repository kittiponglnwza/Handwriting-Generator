// fontBuilder.test.js — Unit tests for font compilation engine
import { validateSvgPath, buildGlyphMap } from '../../../engine/font/fontBuilder.js'

describe('validateSvgPath', () => {
  it('rejects empty string', () => {
    expect(validateSvgPath('').valid).toBe(false)
  })
  it('rejects placeholder M 0 0', () => {
    expect(validateSvgPath('M 0 0').valid).toBe(false)
  })
  it('rejects path with no L/C/Q', () => {
    expect(validateSvgPath('M 10 20').valid).toBe(false)
  })
  it('accepts a valid path', () => {
    expect(validateSvgPath('M 10 10 L 50 50 L 90 10').valid).toBe(true)
  })
  it('rejects path with NaN coordinates', () => {
    expect(validateSvgPath('M NaN 10 L 50 50').valid).toBe(false)
  })
})
