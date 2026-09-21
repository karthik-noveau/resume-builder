import type { PersonalInfo } from '@/shared/types/resume.types'
import type { LayoutNode, LayoutStyles, PersonalInfoTextField } from '@/shared/types/layout.types'
import type { LayoutBuilder } from './layout.builder'
import { avgGlyphWidth, displayUrl, estimateStyledTextHeight } from './layout.utils'
import { measureTextWidth } from '@/shared/utils/textMeasurement'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'

export interface ContactItem {
  field: PersonalInfoTextField
  content: string
}

export function contactItems(
  info: PersonalInfo,
  fields: PersonalInfoTextField[]
): ContactItem[] {
  return fields.flatMap((field) => {
    const raw = info[field]
    if (!raw) return []
    const content = field === 'website' || field === 'linkedin' || field === 'github' || field === 'portfolio'
      ? displayUrl(raw)
      : raw
    return [{ field, content }]
  })
}

interface MeasuredItem extends ContactItem {
  width: number
}

interface ContactLine {
  items: MeasuredItem[]
  width: number
}

function measureLines(
  items: ContactItem[],
  width: number,
  fontSize: number,
  letterSpacing: number,
  separator: string,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
): { lines: ContactLine[]; separatorWidth: number } {
  const separatorWidth = Math.max(12, measureTextWidth(separator, fontSize, family, weight, letterSpacing)
    ?? separator.length * avgGlyphWidth(separator, fontSize, letterSpacing))
  const lines: ContactLine[] = []
  let line: ContactLine = { items: [], width: 0 }

  for (const item of items) {
    // Email addresses and domains are dense, unbroken runs. A safety margin
    // keeps the browser's real glyph metrics from wrapping their final letter
    // inside a box measured slightly too narrowly by the generic estimator.
    const estimatedWidth = item.content.length * avgGlyphWidth(item.content, fontSize, letterSpacing)
    const measuredWidth = measureTextWidth(item.content, fontSize, family, weight, letterSpacing)
    const itemWidth = Math.min(width, Math.max(fontSize * 1.5, measuredWidth === undefined ? estimatedWidth * 1.1 + 4 : measuredWidth + 2))
    const gap = line.items.length ? separatorWidth : 0
    if (line.items.length && line.width + gap + itemWidth > width) {
      lines.push(line)
      line = { items: [], width: 0 }
    }
    const nextGap = line.items.length ? separatorWidth : 0
    line.items.push({ ...item, width: itemWidth })
    line.width += nextGap + itemWidth
  }
  if (line.items.length) lines.push(line)
  return { lines, separatorWidth }
}

export function measureContactHeight(
  items: ContactItem[],
  width: number,
  fontSize: number,
  lineHeight: number,
  separator = '  ·  ',
  letterSpacing = 0,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
): number {
  if (!items.length) return 0
  return measureLines(items, width, fontSize, letterSpacing, separator, family, weight).lines.reduce((height, line) =>
    height + Math.max(...line.items.map(item => estimateStyledTextHeight(item.content, item.width, fontSize, lineHeight, letterSpacing, family, weight))), 0)
}

/**
 * Builds a visually continuous contact line from individually editable nodes.
 * Separators remain decorative nodes, while each value maps back to its exact
 * PersonalInfo field for canvas hover and one-click editing.
 */
export function buildContactLineNodes(
  b: LayoutBuilder,
  items: ContactItem[],
  x: number,
  y: number,
  width: number,
  styles: Partial<LayoutStyles>,
  separator = '  ·  '
): { nodes: LayoutNode[]; height: number } {
  if (!items.length) return { nodes: [], height: 0 }

  const fontSize = styles.fontSize ?? 9
  const lineHeight = styles.lineHeight ?? 1.4
  const letterSpacing = styles.letterSpacing ?? 0
  const family = styles.fontFamily ?? 'Inter'
  const weight = styles.fontWeight ?? 400
  const measured = measureLines(items, width, fontSize, letterSpacing, separator, family, weight)
  const lineHeightPt = fontSize * lineHeight
  const nodes: LayoutNode[] = []

  let lineY = 0
  measured.lines.forEach((line) => {
    const height = Math.max(...line.items.map(item => estimateStyledTextHeight(item.content, item.width, fontSize, lineHeight, letterSpacing, family, weight)))
    const align = styles.textAlign ?? 'left'
    let cursor = align === 'center' ? (width - line.width) / 2 : align === 'right' ? width - line.width : 0

    line.items.forEach((item, itemIndex) => {
      if (itemIndex > 0) {
        nodes.push(b.node('text', x + cursor, y + lineY, measured.separatorWidth, lineHeightPt, {
          ...styles,
          textAlign: 'center',
        }, { content: separator }))
        cursor += measured.separatorWidth
      }
      nodes.push(b.node('text', x + cursor, y + lineY, item.width, height, {
        ...styles,
        textAlign: 'left',
      }, { content: item.content, editRef: { kind: 'personal-info', field: item.field } }))
      cursor += item.width
    })
    lineY += height
  })

  return { nodes, height: lineY }
}
