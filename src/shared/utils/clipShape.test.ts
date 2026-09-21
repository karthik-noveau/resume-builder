import { describe, expect, it } from 'vitest'
import { clipShapeRadii, clipShapeRadius } from './clipShape'

describe('template corner geometry', () => {
  it.each([
    ['heading band', 320, 24],
    ['narrow heading band', 160, 24],
    ['contact strip', 500, 22],
    ['skill track', 60, 4],
    ['skill fill', 36, 4],
    ['tall panel', 160, 600],
    ['portrait', 120, 160],
    ['square portrait', 120, 120],
  ] as const)('uses circular, zoom-independent corners for a %s', (_, width, height) => {
    const radii = clipShapeRadii('rounded', width, height)
    expect(radii.x).toBe(radii.y)
    expect(radii.x).toBeCloseTo(Math.min(width, height) * 0.14)
    const [x, y] = clipShapeRadius('rounded', width, height)!.split(' / ').map(parseFloat)
    expect(x * width / 100).toBeCloseTo(radii.x, 4)
    expect(y * height / 100).toBeCloseTo(radii.y, 4)
  })

  it('keeps heading corners and skill-track corners consistent across column widths', () => {
    expect(clipShapeRadii('rounded', 160, 24)).toEqual(clipShapeRadii('rounded', 320, 24))
    expect(clipShapeRadii('rounded', 36, 4)).toEqual(clipShapeRadii('rounded', 60, 4))
  })

  it('preserves circle and arch portrait silhouettes', () => {
    expect(clipShapeRadii('circle', 100, 120)).toEqual({ x: 50, y: 60 })
    expect(clipShapeRadius('circle', 100, 120)).toBe('50%')
    expect(clipShapeRadii('arch', 100, 120)).toEqual({ x: 50, y: 42 })
    expect(clipShapeRadius('arch', 100, 120)).toBe('50% 50% 0 0 / 35% 35% 0 0')
    expect(clipShapeRadius(undefined, 100, 120)).toBeUndefined()
  })

  it('handles zero-size clipped decorations without invalid CSS', () => {
    expect(clipShapeRadius('rounded', 0, 24)).toBe('0')
    expect(clipShapeRadius('rounded', 24, 0)).toBe('0')
  })
})
