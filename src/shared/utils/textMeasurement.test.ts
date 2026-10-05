import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { FontEmbedder } from '@/features/export/services/font.embedder'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'
import { estimateStyledTextHeight, estimateTextHeight } from '@/features/templates/engine/layout.utils'
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

  it('reserves the final CSS letter space in narrow section headings', () => {
    const text = 'CORE SKILLS AND TECHNICAL EXPERTISE'
    const measure = (value: string) => measureTextWidth(value, 11, 'Inter', 600, 0.08)!
    expect(wrapTextLines(text, 142.348, measure, 11 * 0.08)).toEqual([
      'CORE SKILLS AND', 'TECHNICAL', 'EXPERTISE',
    ])
    expect(estimateStyledTextHeight(text, 142.348, 11, 1.2, 0.08, 'Inter', 600)).toBeCloseTo(39.6)
  })

  it('wraps hyphenated skills at natural breaks before splitting letters', () => {
    expect(wrapTextLines('Cross-functional Roadmapping and Prioritization', 78.27,
      value => measureTextWidth(value, 10, 'SourceSerifPro')!)).toEqual([
      'Cross-', 'functional', 'Roadmapping', 'and', 'Prioritization',
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
