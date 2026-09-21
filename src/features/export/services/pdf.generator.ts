import type { PDFPage } from 'pdf-lib';
import {
  PDFDocument, rgb, degrees, LineCapStyle, setCharacterSpacing,
  pushGraphicsState, popGraphicsState, beginText, endText,
  setFontAndSize, setTextMatrix, setFillingRgbColor, showText,
  clip, endPath,
} from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { LayoutTree, LayoutNode, LayoutPage } from '@/shared/types/layout.types'
import { FontEmbedder } from './font.embedder'
import { ImageEmbedder } from './image.embedder'
import { LinkHandler } from './link.handler'
import { ICON_PATHS, ICON_VIEWBOX_PX } from '../../templates/engine/icons'
import { shapePath } from './pdf.shapes'
import { wrapTextLines } from '@/shared/utils/textMeasurement'

export class PdfGenerator {
  private fontEmbedder!: FontEmbedder
  private imageEmbedder!: ImageEmbedder
  private linkHandler!: LinkHandler

  async generate(layoutTree: LayoutTree): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    this.fontEmbedder = new FontEmbedder(pdfDoc)
    this.imageEmbedder = new ImageEmbedder(pdfDoc)
    this.linkHandler = new LinkHandler()

    for (const pageLayout of layoutTree.pages) {
      const page = pdfDoc.addPage([pageLayout.widthPt, pageLayout.heightPt])
      await this.drawNodes(page, pageLayout.nodes, pageLayout, 0, 0)
    }

    return await pdfDoc.save()
  }

  private async drawNodes(
    page: PDFPage,
    nodes: LayoutNode[],
    pageLayout: LayoutPage,
    parentX: number,
    parentY: number
  ): Promise<void> {
    for (const node of nodes) {
      const absoluteX = parentX + node.xPt
      const absoluteY = parentY + node.yPt
      
      await this.drawNode(page, node, pageLayout, absoluteX, absoluteY)
      
      if (node.children && node.children.length > 0) {
        await this.drawNodes(page, node.children, pageLayout, absoluteX, absoluteY)
      }
    }
  }

  /**
   * Draws a line slanted, for families that ship no italic cut.
   *
   * None of the four bundled families has an italic file, so `fontStyle:
   * 'italic'` — which the templates set on every date and location — rendered
   * upright in the PDF while the preview showed it slanted. Rather than ship
   * four more font files, the glyphs are sheared by the text matrix: the same
   * synthesised oblique a word processor falls back to. The text itself is
   * unchanged, so the PDF stays selectable and parseable by an ATS.
   */
  private drawObliqueText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color: { r: number; g: number; b: number },
  ): void {
    // tan(12°) — the conventional slant, matching how browsers synthesise it.
    const SHEAR = 0.2126
    // Registers the font in this page's resource dictionary and returns the
    // name to reference it by — the same public call pdf-lib's own drawText
    // makes. Inventing a name, or reaching for the private getFont(), would
    // leave an unregistered reference that opens as a blank page, and this is
    // the product's actual output.
    const fontKey = page.node.newFontDictionary(font.name, font.ref)
    page.pushOperators(
      pushGraphicsState(),
      beginText(),
      setFillingRgbColor(color.r, color.g, color.b),
      setFontAndSize(fontKey, size),
      // [a b c d e f] — c is the horizontal shear applied per unit of height.
      setTextMatrix(1, 0, SHEAR, 1, x, y),
      showText(font.encodeText(text)),
      endText(),
      popGraphicsState(),
    )
  }

  private async drawNode(
    page: PDFPage,
    node: LayoutNode,
    pageLayout: LayoutPage,
    absX: number,
    absY: number
  ): Promise<void> {
    const { type, widthPt, heightPt, styles, content, href, imageId, clipShape, iconName, rotationDeg } = node
    const yPdf = pageLayout.heightPt - absY - heightPt

    // Background Rendering
    const bgColor = styles.backgroundColor || (type === 'rect' ? styles.color : null)
    if (bgColor && widthPt > 0 && heightPt > 0 && type === 'rect' && clipShape === 'circle') {
      // Circular fill (section-header badges, dots). drawEllipse takes a centre
      // point, unlike drawRectangle's corner origin.
      const { r, g, b, a } = this.parseColor(bgColor)
      page.drawEllipse({
        x: absX + widthPt / 2,
        y: yPdf + heightPt / 2,
        xScale: widthPt / 2,
        yScale: heightPt / 2,
        color: rgb(r, g, b),
        opacity: a,
      })
    } else if (bgColor && widthPt > 0 && heightPt > 0) {
      const { r, g, b, a } = this.parseColor(bgColor)
      if (type === 'rect' && clipShape) {
        page.pushOperators(pushGraphicsState(), ...shapePath(absX, yPdf, widthPt, heightPt, clipShape), clip(), endPath())
      }
      // pdf-lib rotates a rectangle around its (x, y) corner, not its center.
      // Positive degrees is clockwise in screen/CSS space (y-down); PDF space
      // is y-up, so negate to keep rotationDeg visually consistent between
      // the canvas preview (CSS transform: rotate) and this export.
      let rectX = absX
      let rectY = yPdf
      if (rotationDeg) {
        const theta = (-rotationDeg * Math.PI) / 180
        const cx = absX + widthPt / 2
        const cy = yPdf + heightPt / 2
        rectX = cx - ((widthPt / 2) * Math.cos(theta) - (heightPt / 2) * Math.sin(theta))
        rectY = cy - ((widthPt / 2) * Math.sin(theta) + (heightPt / 2) * Math.cos(theta))
      }
      page.drawRectangle({
        x: rectX,
        y: rectY,
        width: widthPt,
        height: heightPt,
        color: rgb(r, g, b),
        opacity: a,
        rotate: rotationDeg ? degrees(-rotationDeg) : undefined,
      })
      if (type === 'rect' && clipShape) page.pushOperators(popGraphicsState())
    }

    // 'tag' belongs in this group: CanvasLeaf draws its label on screen, so
    // omitting it here silently dropped the text from the export, leaving an
    // empty chip on the page.
    switch (type) {
      case 'text':
      case 'bullet':
      case 'section-header':
      case 'entry-header':
      case 'entry-body':
      case 'tag':
        if (content) {
          const font = await this.fontEmbedder.getFont(styles.fontFamily, styles.fontWeight)
          const fontSize = styles.fontSize
          const lineHeight = styles.lineHeight * fontSize
          // LayoutStyles carries letterSpacing in em, as CSS does; PDF character
          // spacing is an absolute advance, so it scales with the font size.
          // Rounded because the product of two floats goes into the file
          // verbatim: 0.1em at 12pt is 1.2000000000000002, which is seventeen
          // characters of noise per tracked run for no visible difference.
          const tracking = Math.round((styles.letterSpacing ?? 0) * fontSize * 1000) / 1000
          /** Width as it will actually be drawn — pdf-lib measures the glyphs
           * only, so a tracked run measures short by one advance per character.
           * Every template letterspaces its section titles, so without this the
           * export wrapped at different words than the preview did. */
          const widthOf = (text: string) =>
            font.widthOfTextAtSize(text, fontSize) + Math.max(0, text.length - 1) * tracking

          // Explicit breaks are part of the layout (notably stacked names).
          // Never pass them through to drawText: pdf-lib would apply its own
          // default line spacing inside a single call instead of this node's.
          const lines = wrapTextLines(content, widthPt, widthOf)

          // Applied once around the whole run and reset after, so it cannot
          // leak into the next node drawn on this page.
          if (tracking !== 0) page.pushOperators(setCharacterSpacing(tracking))

          let lineY = yPdf + heightPt - lineHeight 
          for (const line of lines) {
            if (!line) {
              lineY -= lineHeight
              continue
            }
            const lineWidth = widthOf(line)
            let drawX = absX
            if (styles.textAlign === 'center') {
              drawX = absX + (widthPt - lineWidth) / 2
            } else if (styles.textAlign === 'right') {
              drawX = absX + (widthPt - lineWidth)
            }

            const { r, g, b, a } = this.parseColor(styles.color)
            const baselineY = lineY + (lineHeight * 0.25)
            if (styles.fontStyle === 'italic') {
              this.drawObliqueText(page, line, drawX, baselineY, fontSize, font, { r, g, b })
            } else {
              page.drawText(line, {
                x: drawX,
                y: baselineY,
                size: fontSize,
                font,
                color: rgb(r, g, b),
                opacity: a
              })
            }
            if (styles.textDecoration === 'underline' && line) {
              // pdf-lib has no text-decoration, so the rule is drawn by hand.
              // Offsets are fractions of the font size so the line tracks the
              // text at any size the style inspector allows.
              page.drawRectangle({
                x: drawX,
                y: baselineY - fontSize * 0.12,
                width: lineWidth,
                height: Math.max(0.4, fontSize * 0.05),
                color: rgb(r, g, b),
                opacity: a,
              })
            }
            lineY -= lineHeight
          }

          if (tracking !== 0) page.pushOperators(setCharacterSpacing(0))
        }
        break

      case 'divider': {
          const { r, g, b, a } = this.parseColor(styles.color)
          page.drawRectangle({
            x: absX,
            y: yPdf,
            width: widthPt,
            height: heightPt,
            color: rgb(r, g, b),
            opacity: a
          })
          break
      }

      case 'image':
        if (imageId) {
          const image = await this.imageEmbedder.getImage(imageId)
          if (image) {
            // Match object-fit: cover, with real clipping instead of painting
            // corner masks that can obscure an adjacent panel or photo ring.
            const scale = Math.max(widthPt / image.width, heightPt / image.height)
            const imageW = image.width * scale
            const imageH = image.height * scale
            page.pushOperators(pushGraphicsState(), ...shapePath(absX, yPdf, widthPt, heightPt, clipShape), clip(), endPath())
            page.drawImage(image, {
              x: absX + (widthPt - imageW) / 2,
              y: yPdf + (heightPt - imageH) / 2,
              width: imageW,
              height: imageH,
            })
            page.pushOperators(popGraphicsState())
          }
        }
        break

      case 'icon':
        if (iconName) {
          const path = ICON_PATHS[iconName]
          const { r, g, b, a } = this.parseColor(styles.color)
          const scale = Math.min(widthPt, heightPt) / ICON_VIEWBOX_PX
          page.drawSvgPath(path, {
            x: absX,
            y: yPdf + heightPt,
            scale,
            borderColor: rgb(r, g, b),
            borderOpacity: a,
            borderWidth: 1.6,
            borderLineCap: LineCapStyle.Round,
          })
        }
        break

      case 'link':
        if (href) {
          this.linkHandler.addLink(page, href, {
            x: absX,
            y: yPdf,
            width: widthPt,
            height: heightPt,
          })
        }
        break
    }
  }

  private parseColor(hex: string): { r: number; g: number; b: number; a: number } {
    const cleanHex = hex.replace('#', '')
    let r = 0, g = 0, b = 0, a = 1

    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255
      g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255
      b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16) / 255
      g = parseInt(cleanHex.substring(2, 4), 16) / 255
      b = parseInt(cleanHex.substring(4, 6), 16) / 255
    } else if (cleanHex.length === 8) {
      r = parseInt(cleanHex.substring(0, 2), 16) / 255
      g = parseInt(cleanHex.substring(2, 4), 16) / 255
      b = parseInt(cleanHex.substring(4, 6), 16) / 255
      a = parseInt(cleanHex.substring(6, 8), 16) / 255
    }
    
    return { r, g, b, a }
  }
}
