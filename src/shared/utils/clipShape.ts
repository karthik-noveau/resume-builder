import type { ClipShape } from '@/shared/types/layout.types'

/** Shared point-based geometry for the canvas and vector export. */
export function clipShapeRadii(shape: ClipShape | undefined, width: number, height: number) {
  if (shape === 'circle') return { x: width / 2, y: height / 2 }
  if (shape === 'arch') return { x: width / 2, y: height * 0.35 }
  // One circular radius, not separate percentages of each axis. Independent
  // percentages turn wide heading bands and contact strips into stretched ovals.
  const radius = shape === 'rounded' ? Math.max(0, Math.min(width, height)) * 0.14 : 0
  return { x: radius, y: radius }
}

/** Percentages preserve point geometry at every canvas/thumbnail zoom level. */
export function clipShapeRadius(shape: ClipShape | undefined, width: number, height: number): string | undefined {
  if (shape === 'circle') return '50%'
  if (shape === 'rounded') {
    if (width <= 0 || height <= 0) return '0'
    const radius = clipShapeRadii(shape, width, height)
    const percent = (value: number, size: number) => `${Number((value / size * 100).toFixed(6))}%`
    return `${percent(radius.x, width)} / ${percent(radius.y, height)}`
  }
  if (shape === 'arch') return '50% 50% 0 0 / 35% 35% 0 0'
  return undefined
}
