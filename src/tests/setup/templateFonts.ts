import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { vi } from 'vitest'
import { fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'

/** Layout assertions must use the same bundled font metrics as the browser,
 * not the emergency approximation used when a font fails to load. */
export function loadTemplateFonts() {
  const buffers = new Map<string, ArrayBuffer>()
  const families: FontFamily[] = ['Inter', 'Manrope', 'SourceSerifPro', 'IBMPlexSans']
  const weights: FontWeight[] = [400, 500, 600, 700, 800]
  for (const family of families)
    for (const weight of weights) {
      let path: string
      try {
        path = fontRegistry.getFontPath(family, weight)
      } catch {
        continue
      }
      const bytes = readFileSync(resolve(process.cwd(), 'public', path.slice(1)))
      buffers.set(`${family}-${weight}`, Uint8Array.from(bytes).buffer)
    }
  vi.spyOn(fontRegistry, 'hasFont').mockImplementation((family, weight) =>
    buffers.has(`${family}-${weight}`)
  )
  vi.spyOn(fontRegistry, 'getFont').mockImplementation((family, weight) => {
    const buffer = buffers.get(`${family}-${weight}`)
    if (!buffer) throw new Error(`Font not loaded: ${family}-${weight}`)
    return buffer
  })
}
