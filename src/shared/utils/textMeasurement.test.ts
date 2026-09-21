import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { FontEmbedder } from '@/features/export/services/font.embedder'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'
import { estimateTextHeight } from '@/features/templates/engine/layout.utils'
import { measureTextWidth, wrapTextLines } from './textMeasurement'

loadTemplateFonts()

describe('font-accurate resume measurement', () => {
  it('distinguishes narrow and wide characters with the same character count', () => {
    expect(measureTextWidth('iiiiiiii', 10)!).toBeLessThan(measureTextWidth('WWWWWWWW', 10)! / 2)
    expect(estimateTextHeight('iiiiiiii', 40, 10, 1.4)).toBe(14)
    expect(estimateTextHeight('WWWWWWWW', 40, 10, 1.4)).toBeGreaterThan(14)
  })

  it.each(['Inter', 'Manrope', 'SourceSerifPro', 'IBMPlexSans'] as const)(
    'matches exported %s glyph advances',
    async (family) => {
      const font = await new FontEmbedder(await PDFDocument.create()).getFont(family, 600)
      const text = 'Professional Experience 2024 – Present'
      expect(measureTextWidth(text, 11, family, 600)).toBeCloseTo(
        font.widthOfTextAtSize(text, 11),
        6
      )
      expect(measureTextWidth(text, 11, family, 600, 0.08)).toBeCloseTo(
        font.widthOfTextAtSize(text, 11) + (text.length - 1) * 11 * 0.08,
        6
      )
    }
  )

  it('respects paragraphs and empty lines while wrapping words', () => {
    expect(wrapTextLines('first paragraph\r\n\r\nlast line', 10, (text) => text.length)).toEqual([
      'first',
      'paragraph',
      '',
      'last line',
    ])
  })

  it('breaks long contact values without dropping any characters', () => {
    const text = 'alexandra.morgan@example.com'
    const lines = wrapTextLines(text, 60, (value) => measureTextWidth(value, 9)!)
    expect(lines.join('')).toBe(text)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((line) => measureTextWidth(line, 9)! <= 60)).toBe(true)
  })
})
