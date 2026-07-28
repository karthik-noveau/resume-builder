import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call onClick when loading', async () => {
    const handler = vi.fn()
    render(<Button loading onClick={handler}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders all variants without error', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  it('renders all sizes without error', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>{size}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  it('supports aria-label for icon-only buttons', () => {
    render(<Button aria-label="Close dialog" />)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })

  it('defaults to type="button" to prevent accidental form submission', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
