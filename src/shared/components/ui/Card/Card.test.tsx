import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Card onClick={handler}>Click me</Card>)
    await userEvent.click(screen.getByText('Click me'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('accepts custom className', () => {
    const { container } = render(<Card className="custom-class">Body</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
