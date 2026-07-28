import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import { logger } from './logger'

export type { FontFamily, FontWeight }

type FontKey = `${FontFamily}-${FontWeight}`

const FONT_FILES: Partial<Record<FontKey, string>> = {
  'Inter-400': '/fonts/Inter-Regular.woff',
  'Inter-500': '/fonts/Inter-Medium.woff',
  'Inter-600': '/fonts/Inter-SemiBold.woff',
  'Inter-700': '/fonts/Inter-Bold.woff',
  'Inter-800': '/fonts/Inter-ExtraBold.woff',
  'SourceSerifPro-400': '/fonts/SourceSerifPro-Regular.woff',
  'SourceSerifPro-600': '/fonts/SourceSerifPro-SemiBold.woff',
  'SourceSerifPro-700': '/fonts/SourceSerifPro-Bold.woff',
  'Manrope-400': '/fonts/Manrope-Regular.woff',
  'Manrope-600': '/fonts/Manrope-SemiBold.woff',
  'Manrope-700': '/fonts/Manrope-Bold.woff',
  'IBMPlexSans-400': '/fonts/IBMPlexSans-Regular.woff',
  'IBMPlexSans-500': '/fonts/IBMPlexSans-Medium.woff',
  'IBMPlexSans-600': '/fonts/IBMPlexSans-SemiBold.woff',
}

class FontRegistryImpl {
  private fonts = new Map<FontKey, ArrayBuffer>()
  private initialized = false

  async initialize(): Promise<void> {
    const results = await Promise.allSettled(
      (Object.entries(FONT_FILES) as [FontKey, string][]).map(async ([key, path]) => {
        const res = await fetch(path)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        this.fonts.set(key, buf)
      })
    )

    const loaded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0) {
      logger.warn(`FontRegistry: ${loaded} fonts loaded, ${failed} unavailable — PDF will use standard fonts as fallback`)
    } else {
      logger.info('FontRegistry: all fonts loaded', { count: loaded })
    }

    this.initialized = true
  }

  getFont(family: FontFamily, weight: FontWeight): ArrayBuffer {
    const key: FontKey = `${family}-${weight}`
    const buf = this.fonts.get(key)
    if (!buf) throw new Error(`Font not loaded: ${key}`)
    return buf
  }

  getFontPath(family: FontFamily, weight: FontWeight): string {
    const key: FontKey = `${family}-${weight}`
    const path = FONT_FILES[key]
    if (!path) throw new Error(`No font file registered for ${key}`)
    return path
  }

  hasFont(family: FontFamily, weight: FontWeight): boolean {
    return this.fonts.has(`${family}-${weight}`)
  }

  isReady(): boolean {
    return this.initialized
  }
}

export const fontRegistry = new FontRegistryImpl()
