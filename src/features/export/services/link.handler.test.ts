import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFDict, PDFName, PDFString } from 'pdf-lib'
import { LinkHandler } from './link.handler'

describe('PDF links', () => {
  it('preserves website and email links as URI strings through serialization', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    const links = new LinkHandler()
    const targets = ['https://example.org/work?view=1&tab=2', 'mailto:alex@example.org']
    for (const href of targets) links.addLink(page, href, { x: 10, y: 20, width: 100, height: 12 })
    const read = await PDFDocument.load(await doc.save())
    const annots = read.getPage(0).node.Annots()!
    expect(annots.size()).toBe(2)
    for (let i = 0; i < targets.length; i++) {
      const annotation = read.context.lookup(annots.get(i), PDFDict)
      const action = annotation.lookup(PDFName.of('A'), PDFDict)
      expect(action.lookup(PDFName.of('URI'), PDFString).decodeText()).toBe(targets[i])
    }
  })
  it('does not emit links with executable or local-file protocols', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    for (const href of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello']) {
      new LinkHandler().addLink(page, href, { x: 0, y: 0, width: 10, height: 10 })
    }
    expect(page.node.Annots()).toBeUndefined()
  })
})
