import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Drawer } from './Drawer'

function getMask() {
  const mask = document.querySelector<HTMLElement>('.ant-drawer-mask')
  if (!mask) throw new Error('Drawer mask not found')
  return mask
}

describe('Drawer', () => {
  it('renders content when open', () => {
    render(
      <Drawer isOpen onClose={() => {}}>
        <p>Drawer content</p>
      </Drawer>
    )
    expect(screen.getByText('Drawer content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Drawer isOpen={false} onClose={() => {}}>
        <p>Hidden</p>
      </Drawer>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Drawer isOpen title="Section Settings" onClose={() => {}}>
        <p>Body</p>
      </Drawer>
    )
    expect(screen.getByText('Section Settings')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Body</p>
      </Drawer>
    )
    fireEvent.click(getMask())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Body</p>
      </Drawer>
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
