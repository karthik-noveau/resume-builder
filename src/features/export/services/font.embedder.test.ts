import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { fontRegistry } from '@/shared/services/font.registry'
import { FontEmbedder } from './font.embedder'

describe('PDF preview with custom font weights', () => {
  beforeAll(async () => {
    vi.stubGlobal('fetch', vi.fn((path: string) => Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(Uint8Array.from(
        readFileSync(resolve(process.cwd(), 'public', path.slice(1)))
      ).buffer),
    })))
    try {
      await fontRegistry.initialize()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it.each([
    ['Manrope', 500, 'Manrope'],
    ['Manrope', 800, 'Manrope'],
    ['SourceSerifPro', 500, 'SourceSerif4'],
    ['SourceSerifPro', 800, 'SourceSerif4'],
    ['IBMPlexSans', 700, 'IBMPlexSans'],
    ['IBMPlexSans', 800, 'IBMPlexSans'],
  ] as const)('embeds %s at weight %i without losing the family', async (family, weight, name) => {
    const document = await PDFDocument.create()
    const font = await new FontEmbedder(document).getFont(family, weight)

    expect(fontRegistry.hasFont(family, weight)).toBe(true)
    expect(font.name).toContain(name)
    // Helvetica's WinAnsi fallback throws for this ordinary name. A missing
    // weight must not prevent the entire resume from being previewed/exported.
    document.addPage().drawText('Łukasz', { font, size: 12 })
    const reopened = await PDFDocument.load(await document.save())
    expect(reopened.getPageCount()).toBe(1)
  })
})
