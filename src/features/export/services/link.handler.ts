import { PDFString, type PDFPage } from 'pdf-lib'
import { safeLink } from '@/shared/utils/safeLink'

export class LinkHandler {
  constructor() {}

  addLink(
    page: PDFPage,
    href: string,
    rect: { x: number; y: number; width: number; height: number }
  ) {
    const url = safeLink(href)
    if (!url) return
    const linkAnnotation = page.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
      Border: [0, 0, 0],
      C: [0, 0, 1], // Blue border if Border not [0,0,0]
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(url),
      },
    })

    page.node.addAnnot(page.doc.context.register(linkAnnotation))
  }
}
