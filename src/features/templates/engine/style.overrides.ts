import type { Resume } from '@/shared/types/resume.types'
import type { FontPreset, RoleTypographyOverrides } from '@/shared/types/font.types'
import type { LayoutNode, LayoutPage, LayoutStyles, LayoutTree } from '@/shared/types/layout.types'
import type { ElementStyle, ResumeStyleOverrides, StyleRole, TextTransform } from '@/shared/types/style.types'
import { HEADING_ROLES, ROLE_SCALE_KEY, STYLE_ROLES } from '@/shared/types/style.types'
import { annotateStyleTargets, isTextNode } from './style.roles'
import { estimateStyledTextHeight } from './layout.utils'

/**
 * Applies a resume's per-element design overrides.
 *
 * The work is split across the render in two places, and the split is the whole
 * design:
 *
 *  - **Sizes, families and leading set on a text style** go in *before* the
 *    template renders, folded into the FontPreset (`toRoleTypography`). The
 *    layout engine then measures, stacks and paginates with the user's values,
 *    so making body text 12pt reflows the page properly instead of overlapping
 *    the block beneath it.
 *  - **Everything else**, plus every single-element override, is applied to the
 *    finished tree (`applyStyleOverrides`). These are mostly paint-only; where
 *    one does change how much room a run of text needs — a larger size on one
 *    element, uppercasing, wider tracking — `repairFlow` re-stacks what sits
 *    below it.
 */

// ─── Tier 1: text styles, folded into the font preset ─────────────────────────

export function toRoleTypography(overrides: ResumeStyleOverrides | undefined): RoleTypographyOverrides | undefined {
  const roles = overrides?.roles
  if (!roles) return undefined

  const result: RoleTypographyOverrides = {}
  // Fixed order so that roles sharing a target (all heading roles share
  // `headingFamily`) resolve the same way on every render.
  for (const role of STYLE_ROLES) {
    const style = roles[role]
    if (!style) continue

    if (style.fontSize !== undefined) {
      result.scale = { ...result.scale, [ROLE_SCALE_KEY[role]]: style.fontSize }
    }
    if (style.fontFamily !== undefined) {
      if (HEADING_ROLES.includes(role)) result.headingFamily = style.fontFamily
      else result.bodyFamily = style.fontFamily
    }
    if (style.lineHeight !== undefined) {
      const key = HEADING_ROLES.includes(role) ? 'heading' : 'body'
      result.lineHeight = { ...result.lineHeight, [key]: style.lineHeight }
    }
  }

  return Object.keys(result).length ? result : undefined
}

export function withRoleTypography(fp: FontPreset, overrides: ResumeStyleOverrides | undefined): FontPreset {
  const roleOverrides = toRoleTypography(overrides)
  return roleOverrides ? { ...fp, roleOverrides } : fp
}

/**
 * The properties a text style applies after rendering.
 *
 * Size, family and leading are deliberately absent: those already went through
 * the font preset, and re-applying them here would flatten any deliberate
 * template derivation (a header that renders the name at 1.15× its scale, say)
 * back to the raw value.
 */
const ROLE_PAINT_KEYS = [
  'color', 'backgroundColor', 'fontWeight', 'letterSpacing',
  'textAlign', 'textTransform', 'fontStyle', 'textDecoration',
  'paddingTopPt', 'paddingRightPt', 'paddingBottomPt', 'paddingLeftPt',
] as const satisfies readonly (keyof ElementStyle)[]

// ─── Tier 2: the finished tree ────────────────────────────────────────────────

export function applyStyleOverrides(tree: LayoutTree, resume: Resume): LayoutTree {
  // Renderers come from a registry that anything can add to, so a malformed
  // tree is a possible input rather than an impossible one. Pass it through
  // untouched instead of throwing from a styling pass.
  if (!Array.isArray(tree?.pages)) return tree

  const overrides = resume.styleOverrides
  // Every tree gets annotated even with no overrides saved: the inspector needs
  // a style key on each node to have something to write an override against.
  annotateStyleTargets(tree.pages)
  if (!overrides) return tree

  const roles = overrides.roles ?? {}
  const elements = overrides.elements ?? {}
  const hasAny = Object.keys(roles).length > 0 || Object.keys(elements).length > 0

  if (hasAny) {
    for (const page of tree.pages) {
      // What each node measured as before the override, captured on the way in
      // so the repair pass can compare like with like.
      const baseline = new Map<LayoutNode, TextMetrics>()
      applyToNodes(page.nodes, roles, elements, baseline)
      repairFlow(page.nodes, baseline)
    }
  }

  if (overrides.page?.backgroundColor) {
    for (const page of tree.pages) {
      paintPageBackground(page, overrides.page.backgroundColor)
    }
  }

  return tree
}

/** The inputs to the height estimator, as they stood before any override. */
interface TextMetrics {
  content: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
}

function applyToNodes(
  nodes: LayoutNode[],
  roles: Partial<Record<StyleRole, ElementStyle>>,
  elements: Record<string, ElementStyle>,
  baseline: Map<LayoutNode, TextMetrics>,
): void {
  for (const node of nodes) {
    const roleStyle = node.styleRole ? roles[node.styleRole] : undefined
    const elementStyle = node.styleKey ? elements[node.styleKey] : undefined

    if (roleStyle || elementStyle) {
      const before = node.styles
      if (affectsHeight(node)) {
        baseline.set(node, {
          content: node.content ?? '',
          fontSize: before.fontSize,
          lineHeight: before.lineHeight,
          letterSpacing: before.letterSpacing ?? 0,
        })
      }
      const next: LayoutStyles = { ...before }

      if (roleStyle) {
        for (const key of ROLE_PAINT_KEYS) assign(next, key, roleStyle[key])
      }
      if (elementStyle) {
        // The element tier is unrestricted — a one-off override is the place
        // where a size change is expected, and repairFlow re-stacks for it.
        for (const key of ELEMENT_PAINT_KEYS) assign(next, key, elementStyle[key])
      }

      node.styles = next
      if (node.content !== undefined && next.textTransform && next.textTransform !== 'none') {
        // Transforming the content string rather than painting it means the PDF
        // exporter, which only reads `content`, stays in step with the canvas
        // without needing to learn about text-transform at all.
        node.content = transformText(node.content, next.textTransform)
      }
    }

    if (node.children.length) applyToNodes(node.children, roles, elements, baseline)
  }
}

const ELEMENT_PAINT_KEYS = [
  ...ROLE_PAINT_KEYS, 'fontFamily', 'fontSize', 'lineHeight',
] as const satisfies readonly (keyof ElementStyle)[]

function assign<K extends keyof ElementStyle>(
  target: LayoutStyles,
  key: K,
  value: ElementStyle[K],
): void {
  if (value === undefined) return
  ;(target as unknown as Record<string, unknown>)[key] = value
}

function transformText(text: string, transform: TextTransform): string {
  switch (transform) {
    case 'uppercase': return text.toUpperCase()
    case 'lowercase': return text.toLowerCase()
    case 'capitalize': return text.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase())
    default: return text
  }
}

function paintPageBackground(page: LayoutPage, color: string): void {
  page.nodes.unshift({
    id: `page-bg-${page.pageNumber}`,
    type: 'rect',
    xPt: 0,
    yPt: 0,
    widthPt: page.widthPt,
    heightPt: page.heightPt,
    styles: {
      fontFamily: 'Inter',
      fontSize: 0,
      fontWeight: 400,
      color,
      backgroundColor: color,
      lineHeight: 1,
      textAlign: 'left',
    },
    children: [],
  })
}

// ─── Flow repair ──────────────────────────────────────────────────────────────

/** Style properties that change how much vertical room a run of text needs. */
function affectsHeight(node: LayoutNode): boolean {
  return isTextNode(node) && node.content !== undefined
}

/**
 * Re-stacks a sibling list after an override changed some element's height.
 *
 * Deltas are measured with one estimator on both sides of the change, so the
 * estimator's own bias cancels and a node whose style did not change reports
 * exactly zero — which is what keeps this pass from nudging a layout that the
 * template already positioned correctly.
 *
 * Returns how much taller the list became.
 */
function repairFlow(nodes: LayoutNode[], baseline: Map<LayoutNode, TextMetrics>): number {
  if (!nodes.length) return 0

  const ordered = [...nodes].sort((a, b) => a.yPt - b.yPt)
  /** Growth already committed above a given original bottom edge. */
  const growths: { bottom: number; delta: number }[] = []
  let oldMaxBottom = 0
  let newMaxBottom = 0

  for (const node of ordered) {
    const originalY = node.yPt
    const originalHeight = node.heightPt
    oldMaxBottom = Math.max(oldMaxBottom, originalY + originalHeight)

    // Only growth that finished strictly above this node pushes it down. The
    // tolerance keeps a two-up row — a job title on the left and its dates on
    // the right, sharing a Y — from sliding when only one side grew.
    let shift = 0
    for (const g of growths) {
      if (originalY >= g.bottom - 0.5) shift += g.delta
    }
    node.yPt = originalY + shift

    const delta = repairNode(node, baseline)
    if (delta !== 0) growths.push({ bottom: originalY + originalHeight, delta })
    newMaxBottom = Math.max(newMaxBottom, node.yPt + node.heightPt)
  }

  return Math.max(0, newMaxBottom - oldMaxBottom)
}

function repairNode(node: LayoutNode, baseline: Map<LayoutNode, TextMetrics>): number {
  let delta = 0

  const original = baseline.get(node)
  if (original && node.widthPt > 0) {
    const s = node.styles
    const before = estimateStyledTextHeight(
      original.content, node.widthPt, original.fontSize, original.lineHeight, original.letterSpacing,
    )
    const after = estimateStyledTextHeight(
      node.content ?? '', node.widthPt, s.fontSize, s.lineHeight, s.letterSpacing ?? 0,
    )
    delta = after - before
    if (Math.abs(delta) > 0.01) node.heightPt = Math.max(node.heightPt + delta, after)
    else delta = 0
  }

  if (node.children.length) {
    const childDelta = repairFlow(node.children, baseline)
    if (childDelta > 0) {
      node.heightPt += childDelta
      delta += childDelta
    }
  }

  return delta
}
