import { fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import { fontRuns, runWidth } from './fontRuns'

const widths = new Map<string, number>()

/** Measure the bundled typeface, using the same glyph advances as PDF export.
 * Returning undefined keeps the layout usable before fonts are available. */
export function measureTextWidth(
  text: string,
  size: number,
  family: FontFamily = 'Inter',
  weight: FontWeight = 400,
  tracking = 0
): number | undefined {
  if (!fontRegistry.hasFont(family, weight)) return undefined
  const key = `${family}-${weight}`
  const runKey = `${key}:${text}`
  let width = widths.get(runKey)
  if (width === undefined) {
    width = (fontRuns(text, family, weight) ?? []).reduce((sum, run) => sum + runWidth(run), 0)
    if (widths.size >= 5000) widths.clear()
    widths.set(runKey, width)
  }
  return width * size + Math.max(0, Array.from(text).length - 1) * tracking * size
}

/** Shared word wrapping for layout and export, including explicit paragraphs
 * and unbroken URLs. Empty paragraphs intentionally consume one line. */
export function wrapTextLines(
  text: string,
  width: number,
  measure: (text: string) => number,
  trailingSpacing = 0,
): string[] {
  const lines: string[] = []
  // CSS includes letter spacing after the final character in a line box.
  // Reserve it when wrapping so a tightly fitted heading does not gain an
  // unmeasured extra line in the browser. PDF export uses the same allowance.
  const available = Math.max(1, width - Math.max(0, trailingSpacing))
  for (const paragraph of text.split(/\r\n|\r|\n/)) {
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      // Browsers prefer a hyphen or URL slash before breaking an oversized
      // word between arbitrary letters. Keep those opportunities in exports
      // and height calculations, especially for skills in narrow sidebars.
      const parts = word.split(/(?<=[\u002d\u002f\u2010])/u)
      for (const [index, part] of parts.entries()) {
        const separator = line && index === 0 ? ' ' : ''
        if (line && measure(line + separator + part) > available) {
          lines.push(line)
          line = ''
        }
        if (measure(part) > available) {
          for (const { segment: character } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(part)) {
            if (line && measure(line + character) > available) {
              lines.push(line)
              line = ''
            }
            line += character
          }
        } else {
          line += `${line && index === 0 ? ' ' : ''}${part}`
        }
      }
    }
    lines.push(line)
  }
  return lines
}
