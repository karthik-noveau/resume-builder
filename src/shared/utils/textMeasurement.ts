import fontkit, { type Font } from '@pdf-lib/fontkit'
import { fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'

const fonts = new Map<string, Font>()
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
  let font = fonts.get(key)
  if (!font) {
    font = fontkit.create(new Uint8Array(fontRegistry.getFont(family, weight)))
    fonts.set(key, font)
  }
  const runKey = `${key}:${text}`
  let width = widths.get(runKey)
  if (width === undefined) {
    width =
      font.layout(text).glyphs.reduce((sum, glyph) => sum + glyph.advanceWidth, 0) / font.unitsPerEm
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
  measure: (text: string) => number
): string[] {
  const lines: string[] = []
  const available = Math.max(1, width)
  for (const paragraph of text.split(/\r\n|\r|\n/)) {
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && measure(candidate) > available) {
        lines.push(line)
        line = ''
      }
      if (measure(word) > available) {
        for (const character of word) {
          if (line && measure(line + character) > available) {
            lines.push(line)
            line = ''
          }
          line += character
        }
      } else {
        line = line ? `${line} ${word}` : word
      }
    }
    lines.push(line)
  }
  return lines
}
