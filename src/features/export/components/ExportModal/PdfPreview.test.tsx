import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfPreview } from './PdfPreview'

const scenario = vi.hoisted(() => ({
  failure: '',
  paintAutomatically: true,
  widths: [] as (number | undefined)[],
  renderPage: new Map<number, () => void>(),
}))

vi.mock('react-pdf', async () => {
  const { useEffect } = await import('react')
  return {
    pdfjs: { GlobalWorkerOptions: {} },
    Document: function Document({ children, suspense = true, onLoadSuccess, onLoadError }: {
      children: React.ReactNode
      suspense?: boolean
      onLoadSuccess: (pdf: { numPages: number; getPage: () => Promise<{ getViewport: () => { width: number; height: number } }> }) => void
      onLoadError: () => void
    }) {
      useEffect(() => {
        if (scenario.failure === 'document') {
          // react-pdf 11 propagates errors to an outer boundary in Suspense
          // mode, even when an onLoadError callback was supplied.
          if (suspense) throw new Error('PDF URL is unavailable')
          onLoadError()
        } else {
          onLoadSuccess({ numPages: 2, getPage: () => Promise.resolve({ getViewport: () => ({ width: 595, height: 842 }) }) })
        }
      }, [suspense, onLoadError, onLoadSuccess])
      return <div>{children}</div>
    },
    Page: function Page({ pageNumber, suspense = true, width, onRenderError, onRenderSuccess }: {
      pageNumber: number
      suspense?: boolean
      width?: number
      onRenderError: () => void
      onRenderSuccess: () => void
    }) {
      scenario.widths.push(width)
      useEffect(() => {
        if (scenario.failure === 'page') {
          if (suspense) throw new Error('PDF canvas failed')
          onRenderError()
        } else {
          scenario.renderPage.set(pageNumber, onRenderSuccess)
          if (scenario.paintAutomatically) onRenderSuccess()
        }
      }, [pageNumber, suspense, onRenderError, onRenderSuccess])
      return <div>PDF page {pageNumber}</div>
    },
  }
})

describe('PDF preview recovery', () => {
  beforeEach(() => {
    scenario.failure = ''
    scenario.paintAutomatically = true
    scenario.widths = []
    scenario.renderPage.clear()
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the document pages and working zoom controls', async () => {
    render(<PdfPreview url="blob:resume" onRetry={vi.fn()} />)
    expect(await screen.findByText('2 pages')).toBeInTheDocument()
    expect(screen.getByText('PDF page 2')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText('125%')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it.each(['document', 'page'] as const)('keeps a %s failure in the dialog and lets the user retry', async (failure) => {
    scenario.failure = failure
    const retry = vi.fn()
    render(<PdfPreview url="blob:unavailable" onRetry={retry} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('The PDF preview couldn’t load')
    fireEvent.click(screen.getByRole('button', { name: 'Retry preview' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('keeps one loading indicator until every fitted page has painted', async () => {
    scenario.paintAutomatically = false
    render(<PdfPreview url="blob:resume" onRetry={vi.fn()} />)
    await waitFor(() => expect(scenario.renderPage.size).toBe(2))
    expect(screen.getByRole('status', { name: 'Preparing preview…' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(scenario.widths.length).toBeGreaterThan(0)
    expect(scenario.widths.every(width => width !== undefined && width > 0 && width < 595)).toBe(true)

    act(() => scenario.renderPage.get(1)!())
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => scenario.renderPage.get(2)!())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })

  it('shows the same shell while the PDF is still being generated', () => {
    render(<PdfPreview url={null} onRetry={vi.fn()} />)
    expect(screen.getByRole('status', { name: 'Preparing preview…' })).toBeInTheDocument()
    expect(screen.queryByText('PDF page 1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  })
})
