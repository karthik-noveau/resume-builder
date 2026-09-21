import { describe, it, expect } from 'vitest'
import { inflateSync } from 'node:zlib'
import { PdfGenerator } from './pdf.generator'
import type { LayoutNode, LayoutStyles, LayoutTree } from '@/shared/types/layout.types'

/**
 * Integration test against real pdf-lib — deliberately unmocked.
 *
 * The sibling pdf.generator.test.ts stubs pdf-lib out, which is right for
 * checking the generator's control flow but blind to what actually lands in the
 * file. Letter spacing and synthesised oblique are both emitted as raw content
 * stream operators, so the only way to know they survived is to read the bytes.
 */

const baseStyles: LayoutStyles = {
  fontFamily: 'Inter',
  fontSize: 12,
  fontWeight: 400,
  color: '#101010',
  lineHeight: 1.3,
  textAlign: 'left',
}

function textNode(id: string, styles: Partial<LayoutStyles>, content: string): LayoutNode {
  return {
    id,
    type: 'text',
    xPt: 40,
    yPt: id === 'tracked' ? 40 : 90,
    widthPt: 400,
    heightPt: 20,
    styles: { ...baseStyles, ...styles },
    children: [],
    content,
  }
}

function treeWith(nodes: LayoutNode[]): LayoutTree {
  return {
    resumeId: 'r1',
    templateId: 'meridian',
    themeId: 'light',
    fontPresetId: 'professional',
    pageSize: 'A4',
    pages: [{
      pageNumber: 1,
      widthPt: 595.28,
      heightPt: 841.89,
      marginsPt: { top: 42, right: 42, bottom: 42, left: 42 },
      nodes,
    }],
  }
}

/** Every content stream in the file, inflated back to readable operators. */
function contentStreams(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes)
  const raw = buf.toString('latin1')
  const parts: string[] = []
  const marker = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = marker.exec(raw))) {
    const start = m.index + m[0].length
    const end = raw.indexOf('endstream', start)
    if (end < 0) continue
    try {
      parts.push(inflateSync(buf.subarray(start, end)).toString('latin1'))
    } catch {
      // Deliberately skipped, not included raw. A PDF also carries embedded
      // font programs and image data; splicing those in as text drags stray
      // "q" and "BT" bytes into the operator counts and the balance assertions
      // start failing on binary noise rather than on anything real.
    }
  }
  return parts.join('\n')
}

describe('PDF typography reaches the file', () => {
  it('writes letter spacing as a character-spacing operator, and resets it', async () => {
    // 0.1em at 12pt is 1.2pt of tracking.
    const tree = treeWith([textNode('tracked', { letterSpacing: 0.1 }, 'WORK EXPERIENCE')])
    const stream = contentStreams(await new PdfGenerator().generate(tree))

    expect(stream).toMatch(/1\.2 Tc/)
    // Reset afterwards, or the tracking bleeds into every later node on the page.
    expect(stream).toMatch(/0 Tc/)
  })

  it('leaves untracked text alone rather than emitting a zero', async () => {
    const tree = treeWith([textNode('plain', {}, 'Northwind Systems')])
    const stream = contentStreams(await new PdfGenerator().generate(tree))

    expect(stream).not.toMatch(/Tc/)
  })

  it('slants italic text with a sheared text matrix', async () => {
    // None of the bundled families ships an italic cut, so italic is synthesised.
    const tree = treeWith([textNode('italic', { fontStyle: 'italic' }, 'Jan 2022 - Present')])
    const stream = contentStreams(await new PdfGenerator().generate(tree))

    expect(stream).toMatch(/1 0 0\.2126 1 [-0-9.]+ [-0-9.]+ Tm/)
  })

  it('keeps italic text as real text, so it stays selectable and parseable', async () => {
    const tree = treeWith([textNode('italic', { fontStyle: 'italic' }, 'Austin, TX')])
    const stream = contentStreams(await new PdfGenerator().generate(tree))

    // A show-text operator, not a path — an ATS has to be able to read it.
    expect(stream).toMatch(/Tj|TJ/)
  })

  it('balances the graphics and text state it opens', async () => {
    const tree = treeWith([
      textNode('tracked', { letterSpacing: 0.08 }, 'PROFILE'),
      textNode('italic', { fontStyle: 'italic' }, 'Remote'),
    ])
    const stream = contentStreams(await new PdfGenerator().generate(tree))

    // Unbalanced q/Q or BT/ET is how a content stream corrupts a page.
    expect((stream.match(/\bBT\b/g) ?? []).length).toBe((stream.match(/\bET\b/g) ?? []).length)
    expect((stream.match(/\bq\b/g) ?? []).length).toBe((stream.match(/\bQ\b/g) ?? []).length)
  })

  it('produces a file that reopens', async () => {
    const tree = treeWith([textNode('italic', { fontStyle: 'italic', letterSpacing: 0.05 }, 'Both at once')])
    const bytes = await new PdfGenerator().generate(tree)

    const { PDFDocument } = await import('pdf-lib')
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBe(1)
  })

  it.each(['rounded', 'arch'] as const)('exports %s panels as vector clips with balanced graphics state', async clipShape => {
    const node: LayoutNode = {
      ...textNode('panel', { backgroundColor: '#123456' }, ''),
      type: 'rect', widthPt: 140, heightPt: 220, clipShape,
    }
    const bytes = await new PdfGenerator().generate(treeWith([node]))
    const stream = contentStreams(bytes)
    expect(stream).toMatch(/\bW\s+n\b/)
    expect(stream).toMatch(/\bc\b/)
    expect((stream.match(/\bq\b/g) ?? []).length).toBe((stream.match(/\bQ\b/g) ?? []).length)
    const { PDFDocument } = await import('pdf-lib')
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })
})
