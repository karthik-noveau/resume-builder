import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { fontRegistry } from '@/shared/services/font.registry'
import { fontRuns, runWidth } from './fontRuns'
import { wrapTextLines } from './textMeasurement'

beforeAll(async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () =>
          Promise.resolve(Uint8Array.from(readFileSync(resolve('public', path.slice(1)))).buffer),
      })
    )
  )
  try {
    await fontRegistry.initialize()
  } finally {
    vi.unstubAllGlobals()
  }
})

describe('international font fallback', () => {
  it.each(['Łukasz Żółć', 'கார்த்திக்', 'आरव शर्मा', 'Ελένη', 'Олександр'])(
    'shapes %s without missing glyphs',
    (text) => {
      const runs = fontRuns(text, 'Inter', 700, true)!
      expect(runs.map((run) => run.text).join('')).toBe(text)
      for (const run of runs) {
        expect(run.font.layout(run.text).glyphs.every((glyph) => glyph.id !== 0)).toBe(true)
        expect(runWidth(run)).toBeGreaterThan(0)
      }
    }
  )
  it('keeps unsupported Latin letters and their word in the same typeface', () => {
    const runs = fontRuns('Łukasz Żółć', 'Inter', 400, true)!
    expect(runs).toHaveLength(1)
    expect(runs[0].key).toBe('NotoSans-400')
  })
  it('reports unavailable glyphs rather than silently exporting null characters', () => {
    expect(() => fontRuns('中', 'Inter', 400, true)).toThrow('PDF export doesn’t yet support')
  })
  it('keeps combining marks attached when wrapping a narrow column', () => {
    const lines = wrapTextLines('கார்த்திக்', 1, (text) => Array.from(text).length)
    expect(lines.join('')).toBe('கார்த்திக்')
    expect(lines.every((line) => !/^\p{M}/u.test(line))).toBe(true)
  })
})
