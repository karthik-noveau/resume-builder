import type { PDFPage } from 'pdf-lib';
import { PDFDocument, rgb, degrees, LineCapStyle } from 'pdf-lib'
import type { LayoutTree, LayoutNode, LayoutPage } from '@/shared/types/layout.types'
import { FontEmbedder } from './font.embedder'
import { ImageEmbedder } from './image.embedder'
import { LinkHandler } from './link.handler'
import { ICON_PATHS, ICON_VIEWBOX_PX } from '../../templates/engine/icons'

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
          
          const words = content.split(' ')
          const lines: string[] = []
          let currentLine = ''

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word
            const testWidth = font.widthOfTextAtSize(testLine, fontSize)
            if (testWidth > widthPt && currentLine) {
              lines.push(currentLine)
              currentLine = word
            } else {
              currentLine = testLine
            }
          }
          lines.push(currentLine)

          let lineY = yPdf + heightPt - lineHeight 
          for (const line of lines) {
            const lineWidth = font.widthOfTextAtSize(line, fontSize)
            let drawX = absX
            if (styles.textAlign === 'center') {
              drawX = absX + (widthPt - lineWidth) / 2
            } else if (styles.textAlign === 'right') {
              drawX = absX + (widthPt - lineWidth)
            }

            const { r, g, b, a } = this.parseColor(styles.color)
            page.drawText(line, {
              x: drawX,
              y: lineY + (lineHeight * 0.25), 
              size: fontSize,
              font,
              color: rgb(r, g, b),
              opacity: a
            })
            lineY -= lineHeight
          }
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
            page.drawImage(image, {
              x: absX,
              y: yPdf,
              width: widthPt,
              height: heightPt,
            })

            if (clipShape === 'circle') {
              // Fake a circular crop: cover the four corners outside the
              // inscribed circle with the surrounding background color.
              // The rect and circle subpaths wind in opposite directions,
              // so pdf-lib's nonzero-winding fill leaves the circle unpainted.
              const { r: mr, g: mg, b: mb } = this.parseColor(styles.backgroundColor || '#ffffff')
              const cx = widthPt / 2
              const cy = heightPt / 2
              const radius = Math.min(widthPt, heightPt) / 2
              const maskPath =
                `M0,0 L${widthPt},0 L${widthPt},${heightPt} L0,${heightPt} Z ` +
                `M${cx - radius},${cy} A${radius},${radius} 0 1 0 ${cx + radius},${cy} A${radius},${radius} 0 1 0 ${cx - radius},${cy} Z`
              page.drawSvgPath(maskPath, {
                x: absX,
                y: yPdf + heightPt,
                color: rgb(mr, mg, mb),
              })
            }
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
