// glyphVersions.test.js
import { deformPath, buildVersionedGlyphs } from '../../../shared/glyph/glyphVersions.js'

describe('deformPath', () => {
  const base = 'M 10 10 L 50 90'

  it('version 1 returns a bridged path', () => {
    const result = deformPath(base, 1)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('version 2 shifts y downward', () => {
    const result = deformPath(base, 2)
    expect(result).not.toBe(base)
  })

  it('version 3 adds wave', () => {
    const result = deformPath(base, 3)
    expect(result).not.toBe(base)
  })

  it('returns empty string unchanged', () => {
    expect(deformPath('', 1)).toBe('')
  })
})

describe('buildVersionedGlyphs', () => {
  it('produces 3 versions per glyph', () => {
    const glyphs = [{ id: 'g1', ch: 'A', svgPath: 'M 10 10 L 50 90' }]
    const result = buildVersionedGlyphs(glyphs)
    expect(result.length).toBe(3)
    expect(result.map(g => g.version)).toEqual([1, 2, 3])
  })
})
