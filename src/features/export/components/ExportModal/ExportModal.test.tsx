import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExportModal } from './ExportModal'

vi.mock('@/shared/components/ui/Modal/Modal', () => ({
  Modal: ({ children, maxWidth }: { children: ReactNode; maxWidth: string }) => (
    <div role="dialog" data-width={maxWidth}>{children}</div>
  ),
}))
vi.mock('./PdfPreview', () => ({
  PdfPreview: () => <div>Resume pages</div>,
}))

describe('preview opening layout', () => {
  it('keeps the full-size dialog through generation, loading, failure, and close', async () => {
    const props = {
      isOpen: true, onClose: vi.fn(), error: null, onRetry: vi.fn(), mode: 'preview' as const,
    }
    const { rerender } = render(<ExportModal {...props} status="generating" previewUrl={null} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-width', 'full')
    expect(await screen.findByText('Resume pages')).toBeInTheDocument()

    rerender(<ExportModal {...props} status="completed" previewUrl="blob:pdf" />)
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(dialog).toHaveAttribute('data-width', 'full')
    rerender(<ExportModal {...props} status="failed" previewUrl={null} error="Try again" />)
    expect(dialog).toHaveAttribute('data-width', 'full')
    rerender(<ExportModal {...props} isOpen={false} status="idle" previewUrl={null} />)
    expect(dialog).toHaveAttribute('data-width', 'full')
  })

  it('keeps the compact progress dialog for PDF downloads', () => {
    render(<ExportModal isOpen onClose={vi.fn()} status="generating" error={null}
      onRetry={vi.fn()} mode="download" previewUrl={null} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-width', 'md')
  })
})
