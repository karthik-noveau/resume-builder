import type { PDFPage } from 'pdf-lib'

export class LinkHandler {
  constructor() {}

  addLink(page: PDFPage, href: string, rect: { x: number; y: number; width: number; height: number }) {
    // pdf-lib high level API for links is a bit limited, 
    // we use the lower level annotation API if needed.

    // Simplest way to add a link in pdf-lib:
    const linkAnnotation = page.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
      Border: [0, 0, 0],
      C: [0, 0, 1], // Blue border if Border not [0,0,0]
      A: {
        Type: 'Action',
        S: 'URI',
        URI: page.doc.context.obj(href),
      },
    });

    const annots = page.node.get(page.doc.context.obj('Annots'));
    if (annots) {
      // If it exists, it should be an array
      (annots as unknown as Array<unknown>).push(linkAnnotation);
    } else {
      page.node.set(page.doc.context.obj('Annots'), page.doc.context.obj([linkAnnotation]));
    }
  }
}

