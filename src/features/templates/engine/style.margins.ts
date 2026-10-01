import type { LayoutNode } from '@/shared/types/layout.types'
import type { ElementStyle, StyleRole } from '@/shared/types/style.types'
import { estimateStyledTextHeight } from './layout.utils'
import { isTextNode } from './style.roles'

type Roles = Partial<Record<StyleRole, ElementStyle>>
type Elements = Record<string, ElementStyle>
const MARGIN_KEYS = ['marginTopPt', 'marginRightPt', 'marginBottomPt', 'marginLeftPt'] as const

/**
 * Margins change the shared layout geometry, never CSS alone. Horizontal
 * margins inset the allocated box; vertical margins reserve additional flow
 * space. Decorative panels inset within their existing bounds instead of
 * pushing the resume's text out of the panel.
 */
export function applyMarginOverrides(nodes: LayoutNode[], roles: Roles, elements: Elements): void {
  const hasMargins = [...Object.values(roles), ...Object.values(elements)]
    .some(style => MARGIN_KEYS.some(key => (style[key] ?? 0) > 0))
  if (hasMargins) spaceSiblings(nodes, roles, elements)
}

function margin(value: number | undefined): number {
  return Number.isFinite(value) ? Math.min(120, Math.max(0, value!)) : 0
}

function inset(length: number, start: number, end: number, minimum = 1) {
  const available = Math.max(0, length - Math.min(length, minimum))
  const ratio = start + end > available ? available / (start + end) : 1
  return { start: start * ratio, length: length - (start + end) * ratio }
}

function decoration(node: LayoutNode) {
  return node.type === 'rect' || (node.type === 'divider' && node.heightPt > node.widthPt)
}

interface Placement {
  node: LayoutNode
  x: number
  y: number
  width: number
  height: number
  shift: number
  growth: number
}

/** Returns the extra height required by these siblings, keeping columns independent. */
function spaceSiblings(nodes: LayoutNode[], roles: Roles, elements: Elements, widthRatio = 1): number {
  const placements: Placement[] = nodes.map(node => ({
    node, x: node.xPt, y: node.yPt, width: node.widthPt, height: node.heightPt, shift: 0, growth: 0,
  })).sort((a, b) => a.y - b.y)
  let oldBottom = 0
  let newBottom = 0

  for (const current of placements) {
    const { node, x, y, width, height } = current
    // Use the longest preceding flow path rather than summing changes from
    // parallel rows. A date and title growing together must not double the gap.
    for (const previous of placements) {
      if (previous === current) break
      if (decoration(previous.node)) continue
      if (previous.y + previous.height <= y + 0.5 && previous.y < y
        && previous.x < x + width - 0.5 && previous.x + previous.width > x + 0.5) {
        current.shift = Math.max(current.shift, previous.shift + previous.growth)
      }
    }

    const role = node.styleRole ? roles[node.styleRole] : undefined
    const local = node.styleKey ? elements[node.styleKey] : undefined
    const [top, right, bottom, left] = MARGIN_KEYS.map(key => margin(local?.[key] ?? role?.[key]))
    const rigid = node.type === 'image' || node.type === 'icon'
    const horizontal = inset(width * widthRatio, left, right,
      isTextNode(node) ? Math.max(1, node.styles.fontSize) : Math.min(width, 1))
    node.xPt = x * widthRatio + horizontal.start
    node.widthPt = horizontal.length
    node.yPt = y + current.shift

    if (decoration(node)) {
      const vertical = inset(height, top, bottom, Math.min(height, 1))
      node.yPt += vertical.start
      node.heightPt = vertical.length
      continue
    }

    node.yPt += top
    if (node.children.length && width > 0) {
      node.heightPt += spaceSiblings(node.children, roles, elements, node.widthPt / width)
    } else if (isTextNode(node) && node.content && width > 0 && node.widthPt !== width) {
      const s = node.styles
      const measure = (w: number) => estimateStyledTextHeight(
        node.content!, Math.max(1, w - (s.paddingLeftPt ?? 0) - (s.paddingRightPt ?? 0)),
        s.fontSize, s.lineHeight, s.letterSpacing ?? 0, s.fontFamily, s.fontWeight,
      )
      node.heightPt += Math.max(0, measure(node.widthPt) - measure(width))
    } else if (rigid && width > 0) {
      // Portraits and glyphs keep their proportions when their available box narrows.
      node.heightPt *= node.widthPt / width
    }

    current.growth = top + bottom + Math.max(0, node.heightPt - height)
    oldBottom = Math.max(oldBottom, y + height)
    newBottom = Math.max(newBottom, y + height + current.shift + current.growth)
  }
  return Math.max(0, newBottom - oldBottom)
}
