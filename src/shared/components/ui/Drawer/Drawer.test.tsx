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

  it.each([
    ['left', -100],
    ['left', 100],
    ['right', -100],
    ['right', 100],
  ] as const)('closes a %s panel after a horizontal swipe of %s px', (position, distance) => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen position={position} title="Panel" onClose={onClose}>
        <p>Body</p>
      </Drawer>
    )
    const target = screen.getByText('Panel')
    const start = { identifier: 1, clientX: 180, clientY: 100 }
    const end = { ...start, clientX: start.clientX + distance, clientY: 108 }
    fireEvent.touchStart(target, { touches: [start] })
    fireEvent.touchMove(target, { touches: [end] })
    // Cancelling touchend prevents a swipe from becoming a tap on a section.
    expect(fireEvent.touchEnd(target, { touches: [], changedTouches: [end] })).toBe(false)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('preserves vertical scrolling even when the finger later moves sideways', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Scrollable content</p>
      </Drawer>
    )
    const target = screen.getByText('Scrollable content')
    const start = { identifier: 1, clientX: 180, clientY: 100 }
    fireEvent.touchStart(target, { touches: [start] })
    expect(fireEvent.touchMove(target, { touches: [{ ...start, clientY: 140 }] })).toBe(true)
    const end = { ...start, clientX: 70, clientY: 140 }
    expect(fireEvent.touchMove(target, { touches: [end] })).toBe(true)
    fireEvent.touchEnd(target, { touches: [], changedTouches: [end] })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ignores small movements and cancelled or multi-touch gestures', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Body</p>
      </Drawer>
    )
    const target = screen.getByText('Body')
    const start = { identifier: 1, clientX: 180, clientY: 100 }
    const short = { ...start, clientX: 160 }
    fireEvent.touchStart(target, { touches: [start] })
    fireEvent.touchMove(target, { touches: [short] })
    fireEvent.touchEnd(target, { touches: [], changedTouches: [short] })
    const end = { ...start, clientX: 70 }
    fireEvent.touchStart(target, { touches: [start] })
    fireEvent.touchMove(target, { touches: [end] })
    fireEvent.touchCancel(target)
    fireEvent.touchEnd(target, { touches: [], changedTouches: [end] })
    fireEvent.touchStart(target, { touches: [start] })
    fireEvent.touchMove(target, { touches: [end, { ...start, identifier: 2 }] })
    fireEvent.touchEnd(target, { touches: [], changedTouches: [end] })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('leaves text fields, sliders and drag handles in control of their gestures', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen onClose={onClose}>
        <input aria-label="Name" />
        <input type="range" aria-label="Text size" />
        <button data-drag-handle>Reorder</button>
      </Drawer>
    )
    for (const target of [
      screen.getByLabelText('Name'),
      screen.getByLabelText('Text size'),
      screen.getByRole('button', { name: 'Reorder' }),
    ]) {
      const start = { identifier: 1, clientX: 180, clientY: 100 }
      const end = { ...start, clientX: 70 }
      fireEvent.touchStart(target, { touches: [start] })
      expect(fireEvent.touchMove(target, { touches: [end] })).toBe(true)
      fireEvent.touchEnd(target, { touches: [], changedTouches: [end] })
    }
    expect(onClose).not.toHaveBeenCalled()
  })
})
