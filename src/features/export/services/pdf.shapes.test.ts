import { describe, expect, it } from 'vitest'
import { shapePath } from './pdf.shapes'

describe('exported template corner paths', () => {
  it.each([200, 500])('keeps a %s-point band circular at the corners', (width) => {
    const path = shapePath(0, 0, width, 100, 'rounded')
    expect(Number.parseFloat(path[0].toString())).toBeCloseTo(14)
    expect(path[0].toString()).toContain('100 m')
    expect(path[1].toString()).toBe(`${width - 14} 100 l`)
    expect(path[2].toString()).toContain(`${width} 86 c`)
  })

  it('uses the same radius on a tall panel', () => {
    const path = shapePath(0, 0, 100, 500, 'rounded')
    expect(Number.parseFloat(path[0].toString())).toBeCloseTo(14)
    expect(path[0].toString()).toContain('500 m')
    expect(path[2].toString()).toContain('100 486 c')
  })
})
