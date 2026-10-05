import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExportModal } from './ExportModal'

const preview = vi.hoisted(() => ({ onReadyChange: (_ready: boolean) => {} }))

vi.mock('@/shared/components/ui/Modal/Modal', () => ({
  Modal: ({ children, maxWidth }: { children: ReactNode; maxWidth: string }) => (
    <div role="dialog" data-width={maxWidth}>{children}</div>
  ),
}))
vi.mock('./PdfPreview', () => ({
  PdfPreview: ({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) => {
    preview.onReadyChange = onReadyChange
    return <div>Resume pages</div>
  },
}))

describe('preview opening layout', () => {
  it('keeps the document-sized dialog through generation, loading, failure, and close', async () => {
    const props = {
      isOpen: true, onClose: vi.fn(), error: null, onRetry: vi.fn(), onDownload: vi.fn(),
    }
    const { rerender } = render(<ExportModal {...props} status="generating" previewUrl={null} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-width', 'preview')
    expect(await screen.findByText('Resume pages')).toBeInTheDocument()

    rerender(<ExportModal {...props} status="completed" previewUrl="blob:pdf" />)
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(dialog).toHaveAttribute('data-width', 'preview')
    rerender(<ExportModal {...props} status="failed" previewUrl={null} error="Try again" />)
    expect(dialog).toHaveAttribute('data-width', 'preview')
    rerender(<ExportModal {...props} isOpen={false} status="idle" previewUrl={null} />)
    expect(dialog).toHaveAttribute('data-width', 'preview')
  })

  it('only exports the rendered preview and lets the user return to editing', async () => {
    const props = { isOpen: true, onClose: vi.fn(), error: null, onRetry: vi.fn(), onDownload: vi.fn() }
    const { rerender } = render(<ExportModal {...props} status="generating" previewUrl={null} />)
    const download = screen.getByRole('button', { name: 'Export PDF' })
    expect(download).toBeDisabled()
    await screen.findByText('Resume pages')

    rerender(<ExportModal {...props} status="completed" previewUrl="blob:pdf" />)
    expect(download).toBeDisabled()
    act(() => preview.onReadyChange(true))
    expect(download).toBeEnabled()
    expect(props.onDownload).not.toHaveBeenCalled()
    fireEvent.click(download)
    expect(props.onDownload).toHaveBeenCalledOnce()

    act(() => preview.onReadyChange(false))
    expect(download).toBeDisabled()
    act(() => preview.onReadyChange(true))
    rerender(<ExportModal {...props} status="completed" previewUrl="blob:updated-pdf" />)
    expect(download).toBeDisabled()
    rerender(<ExportModal {...props} status="failed" previewUrl={null} error="Try again" />)
    expect(download).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Back to editor' }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })
})
