import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Delete Resume',
  description: 'This action cannot be undone.',
}

describe('ConfirmDialog', () => {
  it('renders title and description', () => {
    render(<ConfirmDialog {...baseProps} />)
    expect(screen.getByText('Delete Resume')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn()
    render(<ConfirmDialog {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog {...baseProps} confirmLabel="Delete forever" cancelLabel="Keep it" />
    )
    expect(screen.getByRole('button', { name: 'Delete forever' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep it' })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog {...baseProps} isOpen={false} />)
    expect(screen.queryByText('Delete Resume')).not.toBeInTheDocument()
  })
})
