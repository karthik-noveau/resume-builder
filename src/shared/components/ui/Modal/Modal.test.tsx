import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from './Modal'

function getMaskWrap() {
  const wrap = document.querySelector<HTMLElement>('.ant-modal-wrap')
  if (!wrap) throw new Error('Modal wrap not found')
  return wrap
}

describe('Modal', () => {
  it('renders content when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <p>Modal body</p>
      </Modal>
    )
    expect(screen.getByText('Modal body')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Hidden content</p>
      </Modal>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal isOpen title="Create Resume" onClose={() => {}}>
        <p>Body</p>
      </Modal>
    )
    expect(screen.getByText('Create Resume')).toBeInTheDocument()
  })

  it('has role="dialog" and aria-modal', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <p>Body</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen title="Test" onClose={onClose}>
        <p>Body</p>
      </Modal>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>
    )
    const wrap = getMaskWrap()
    fireEvent.mouseDown(wrap)
    fireEvent.click(wrap)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose}>
        <p>Body</p>
      </Modal>
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
