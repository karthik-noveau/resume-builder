/// <reference lib="es2022.intl" />
// fontkit's Indic shaper uses generators compiled against this runtime.
import 'regenerator-runtime/runtime'
import fontkit, { type Font } from '@pdf-lib/fontkit'
import { FALLBACK_FAMILIES, fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'

export interface FontRun {
  key: string
  text: string
  font: Font
  buffer: ArrayBuffer
  fallback: boolean
}
const cache = new WeakMap<ArrayBuffer, Font>()
function parsed(buffer: ArrayBuffer) {
  let font = cache.get(buffer)
  if (!font) {
    font = fontkit.create(new Uint8Array(buffer))
    cache.set(buffer, font)
  }
  return font
}
const shapingControls = new Set(['\r', '\n', '\t', '\u200c', '\u200d', '\ufe0e', '\ufe0f'])
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Keep combining marks with their base and shape adjacent glyphs together. */
export function fontRuns(
  text: string,
  family: FontFamily,
  weight: FontWeight,
  strict = false
): FontRun[] | undefined {
  const candidates: Omit<FontRun, 'text'>[] = []
  if (fontRegistry.hasFont(family, weight)) {
    const buffer = fontRegistry.getFont(family, weight)
    candidates.push({ key: `${family}-${weight}`, font: parsed(buffer), buffer, fallback: false })
  }
  for (const fallback of FALLBACK_FAMILIES) {
    const buffer = fontRegistry.getFallbackFont(fallback, weight)
    if (buffer)
      candidates.push({
        key: `${fallback}-${weight >= 600 ? 700 : 400}`,
        font: parsed(buffer),
        buffer,
        fallback: true,
      })
  }
  if (!candidates.length) {
    if (strict && /[^\u0020-\u007e\r\n\t]/u.test(text))
      throw new Error('Fonts could not be loaded. Reload the app before exporting this resume.')
    return undefined
  }
  const runs: FontRun[] = []
  const chunks = text.match(/\s+|\S+/gu) ?? []
  for (const chunk of chunks) {
    // A fallback word uses one face, avoiding font switches inside names such
    // as Łukasz that also confuse PDF text extraction into inserting spaces.
    const wordFont = candidates.find((candidate) =>
      Array.from(chunk).every(
        (char) =>
          shapingControls.has(char) || candidate.font.hasGlyphForCodePoint(char.codePointAt(0)!)
      )
    )
    const segments = wordFont
      ? [chunk]
      : Array.from(segmenter.segment(chunk), (item) => item.segment)
    for (const segment of segments) {
      const supports = (candidate: (typeof candidates)[number]) =>
        Array.from(segment).every(
          (char) =>
            shapingControls.has(char) || candidate.font.hasGlyphForCodePoint(char.codePointAt(0)!)
        )
      const preceding = runs[runs.length - 1]
      const candidate =
        /^\s+$/u.test(segment) && preceding && supports(preceding)
          ? preceding
          : (wordFont ?? candidates.find(supports))
      if (!candidate && strict)
        throw new Error(
          `PDF export doesn’t yet support “${segment}”. Your text is preserved in the editor.`
        )
      const selected = candidate ?? candidates[0]
      const previous = runs[runs.length - 1]
      if (previous?.key === selected.key) previous.text += segment
      else runs.push({ ...selected, text: segment })
    }
  }
  return runs
}

export function runWidth(run: FontRun): number {
  const layout = run.font.layout(run.text)
  return (
    (run.fallback
      ? layout.positions.reduce((sum, position) => sum + position.xAdvance, 0)
      : layout.glyphs.reduce((sum, glyph) => sum + glyph.advanceWidth, 0)) / run.font.unitsPerEm
  )
}
