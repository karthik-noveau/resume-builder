import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { PdfGenerator } from './pdf.generator'
import type { LayoutTree } from '@/shared/types/layout.types'

// Mocking dependencies
vi.mock('pdf-lib', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as Record<string, unknown>,
    PDFDocument: {
      create: vi.fn().mockResolvedValue({
        addPage: vi.fn().mockReturnValue({
          drawRectangle: vi.fn(),
          drawText: vi.fn(),
          drawLine: vi.fn(),
          drawImage: vi.fn(),
          doc: {
            context: {
              obj: vi.fn().mockReturnValue({
                get: vi.fn(),
                set: vi.fn()
              })
            }
          },
          node: {
            get: vi.fn(),
            set: vi.fn()
          }
        }),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        registerFontkit: vi.fn(),
        embedFont: vi.fn().mockResolvedValue({}),
        embedJpg: vi.fn().mockResolvedValue({}),
        embedPng: vi.fn().mockResolvedValue({}),
      })
    }
  }
})

vi.mock('./font.embedder', () => {
  return {
    FontEmbedder: vi.fn().mockImplementation(() => ({
      // pdf.generator.ts measures text width via the embedded PDFFont to
      // wrap lines — a bare {} mock is missing that method entirely.
      getFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5
      })
    }))
  }
})

vi.mock('./image.embedder', () => {
  return {
    ImageEmbedder: vi.fn().mockImplementation(() => ({
      getImage: vi.fn().mockResolvedValue({})
    }))
  }
})

vi.mock('./link.handler', () => {
  return {
    LinkHandler: vi.fn().mockImplementation(() => ({
      addLink: vi.fn()
    }))
  }
})

describe('PdfGenerator', () => {
  const generator = new PdfGenerator()
  beforeEach(() => vi.clearAllMocks())

  const mockLayoutTree: LayoutTree = {
    resumeId: '1',
    templateId: 'meridian',
    themeId: 'light',
    fontPresetId: 'professional',
    pageSize: 'A4',
    pages: [
      {
        pageNumber: 1,
        widthPt: 595.28,
        heightPt: 841.89,
        marginsPt: { top: 42, right: 42, bottom: 42, left: 42 },
        nodes: [
          {
            id: 'n1',
            type: 'text',
            xPt: 50,
            yPt: 50,
            widthPt: 100,
            heightPt: 20,
            styles: {
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: 400,
              color: '#000000',
              lineHeight: 1.2,
              textAlign: 'left'
            },
            children: [],
            content: 'Hello World'
          }
        ]
      }
    ]
  }

  it('generates a PDF from a LayoutTree', async () => {
    const bytes = await generator.generate(mockLayoutTree)
    expect(bytes).toBeDefined()
    expect(bytes).toBeInstanceOf(Uint8Array)
  })

  it('draws stacked display names at the specified line height', async () => {
    const tree = structuredClone(mockLayoutTree)
    const node = tree.pages[0].nodes[0]
    node.content = 'ALEX\nMORGAN'
    node.widthPt = 300
    node.heightPt = 140
    node.styles.fontSize = 61
    node.styles.lineHeight = 1.08

    await generator.generate(tree)
    const page = (await PDFDocument.create()).addPage()
    const calls = vi.mocked(page.drawText).mock.calls
    expect(calls.map(([text]) => text)).toEqual(['ALEX', 'MORGAN'])
    expect(calls[0][1]!.y! - calls[1][1]!.y!).toBeCloseTo(61 * 1.08)
  })

  it('wraps each paragraph independently and preserves empty lines', async () => {
    const tree = structuredClone(mockLayoutTree)
    const node = tree.pages[0].nodes[0]
    node.content = 'First paragraph wraps\r\n\r\nSecond\nThird\rFourth'
    node.heightPt = 120

    await generator.generate(tree)
    const page = (await PDFDocument.create()).addPage()
    const calls = vi.mocked(page.drawText).mock.calls
    expect(calls.map(([text]) => text)).toEqual([
      'First paragraph', 'wraps', 'Second', 'Third', 'Fourth',
    ])
    const lineHeight = node.styles.fontSize * node.styles.lineHeight
    expect(calls[0][1]!.y! - calls[1][1]!.y!).toBeCloseTo(lineHeight)
    expect(calls[1][1]!.y! - calls[2][1]!.y!).toBeCloseTo(lineHeight * 2)
    expect(calls[2][1]!.y! - calls[3][1]!.y!).toBeCloseTo(lineHeight)
  })
})
