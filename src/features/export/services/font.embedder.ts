import type { PDFDocument, PDFFont } from 'pdf-lib'
import { StandardFonts, PDFArray, PDFDict, PDFHexString, PDFName } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fontRegistry } from '@/shared/services/font.registry'
import type { FontFamily, FontWeight } from '@/shared/types/font.types'
import { logger } from '@/shared/services/logger'

export class FontEmbedder {
  private embeddedFonts = new Map<string, PDFFont>()
  private shapedGlyphs = new Map<
    string,
    Map<number, { unicode: string; width: number; gid: number }>
  >()

  private glyphCodes = new Map<string, string>()

  constructor(private pdfDoc: PDFDocument) {
    this.pdfDoc.registerFontkit(fontkit)
  }

  async getRunFont(key: string, buffer: ArrayBuffer): Promise<PDFFont> {
    const existing = this.embeddedFonts.get(key)
    if (existing) return existing
    // fontkit's subset glyph IDs can diverge for composite Indic glyphs,
    // corrupting their width tables and text extraction. Embed the fallback
    // face intact; the compact primary Latin faces remain subsetted below.
    const font = await this.pdfDoc.embedFont(buffer, { subset: !key.startsWith('Noto') })
    this.embeddedFonts.set(key, font)
    return font
  }

  /** Map one painted glyph or one logical source character to an explicit CID. */
  encodeGlyph(key: string, gid: number, advance: number, unicode: string): string {
    const signature = `${key}:${gid}:${advance}:${unicode}`
    const cached = this.glyphCodes.get(signature)
    if (cached) return cached
    const used =
      this.shapedGlyphs.get(key) ??
      new Map<number, { unicode: string; width: number; gid: number }>()
    const cid = used.size + 1
    used.set(cid, {
      unicode: PDFHexString.fromText(unicode).asString().slice(4),
      width: advance,
      gid,
    })
    this.shapedGlyphs.set(key, used)
    const code = cid.toString(16).padStart(4, '0')
    this.glyphCodes.set(signature, code)
    return code
  }

  /** pdf-lib's default tables enumerate cmap characters, missing shaped ligatures.
   * Supply widths and Unicode mappings for the glyphs actually used in the PDF. */
  async finalize() {
    for (const [key, glyphs] of this.shapedGlyphs) {
      const font = this.embeddedFonts.get(key)!
      await font.embed()
      const entries = [...glyphs].sort(([a], [b]) => a - b)
      const mappings: string[] = []
      for (let start = 0; start < entries.length; start += 100) {
        const chunk = entries.slice(start, start + 100)
        mappings.push(
          `${chunk.length} beginbfchar\n${chunk.map(([cid, glyph]) => `<${cid.toString(16).padStart(4, '0')}> <${glyph.unicode}>`).join('\n')}\nendbfchar`
        )
      }
      const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /ResumeUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n${mappings.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`
      const dictionary = this.pdfDoc.context.lookup(font.ref, PDFDict)
      dictionary.set(
        PDFName.of('ToUnicode'),
        this.pdfDoc.context.register(this.pdfDoc.context.flateStream(cmap))
      )
      const descendants = dictionary.lookup(PDFName.of('DescendantFonts'), PDFArray)
      const descendant = descendants.lookup(0, PDFDict)
      const cidMap = new Uint8Array((entries.length + 1) * 2)
      for (const [cid, glyph] of entries) {
        cidMap[cid * 2] = glyph.gid >>> 8
        cidMap[cid * 2 + 1] = glyph.gid & 255
      }
      descendant.set(
        PDFName.of('CIDToGIDMap'),
        this.pdfDoc.context.register(this.pdfDoc.context.flateStream(cidMap))
      )
      descendant.set(
        PDFName.of('W'),
        this.pdfDoc.context.obj(entries.flatMap(([cid, glyph]) => [cid, [glyph.width]]))
      )
    }
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
