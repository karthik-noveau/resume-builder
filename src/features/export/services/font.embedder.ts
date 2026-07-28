import type { PDFDocument, PDFFont } from 'pdf-lib'
import { StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import { logger } from '@/shared/services/logger'

export class FontEmbedder {
  private embeddedFonts = new Map<string, PDFFont>()

  constructor(private pdfDoc: PDFDocument) {
    this.pdfDoc.registerFontkit(fontkit)
  }

  async getFont(family: FontFamily, weight: FontWeight): Promise<PDFFont> {
    const key = `${family}-${weight}`
    if (this.embeddedFonts.has(key)) {
      return this.embeddedFonts.get(key)!
    }

    try {
      const fontBuffer = fontRegistry.getFont(family, weight)
      const font = await this.pdfDoc.embedFont(fontBuffer, { subset: true })
      this.embeddedFonts.set(key, font)
      return font
    } catch (error) {
      logger.error('Failed to embed font', error, { key })
      // Fallback to a standard font if embedding fails
      return this.pdfDoc.embedStandardFont(StandardFonts.Helvetica)
    }
  }
}

