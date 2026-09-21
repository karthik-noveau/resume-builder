import { moveTo, lineTo, appendBezierCurve, closePath } from 'pdf-lib'
import type { ClipShape } from '@/shared/types/layout.types'
import { clipShapeRadii } from '@/shared/utils/clipShape'

/** Vector paths in PDF coordinates; also used to clip cover-scaled portraits. */
export function shapePath(x: number, y: number, w: number, h: number, shape?: ClipShape) {
  const { x: rx, y: ry } = clipShapeRadii(shape, w, h)
  const bx = shape === 'arch' ? 0 : rx
  const by = shape === 'arch' ? 0 : ry
  const k = 0.5522847498
  return [
    moveTo(x + rx, y + h),
    lineTo(x + w - rx, y + h),
    appendBezierCurve(x + w - rx + rx * k, y + h, x + w, y + h - ry + ry * k, x + w, y + h - ry),
    lineTo(x + w, y + by),
    appendBezierCurve(x + w, y + by - by * k, x + w - bx + bx * k, y, x + w - bx, y),
    lineTo(x + bx, y),
    appendBezierCurve(x + bx - bx * k, y, x, y + by - by * k, x, y + by),
    lineTo(x, y + h - ry),
    appendBezierCurve(x, y + h - ry + ry * k, x + rx - rx * k, y + h, x + rx, y + h),
    closePath(),
  ]
}
