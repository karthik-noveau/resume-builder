import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders label connected to textarea', () => {
    render(<Textarea label="Summary" />)
    expect(screen.getByLabelText('Summary')).toBeInTheDocument()
  })

  it('calls onChange when typed', async () => {
    const handler = vi.fn()
    render(<Textarea label="Summary" onChange={handler} />)
    await userEvent.type(screen.getByLabelText('Summary'), 'Hello')
    expect(handler).toHaveBeenCalled()
  })

  it('shows error message with role="alert"', () => {
    render(<Textarea label="Summary" error="Too long" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Too long')
  })

  it('marks textarea as invalid on error', () => {
    render(<Textarea label="Summary" error="Required" />)
    expect(screen.getByLabelText('Summary')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows character count', () => {
    render(
      <Textarea label="Bio" value="Hi" showCharacterCount maxLength={200} onChange={() => {}} />
    )
    expect(screen.getByText('2/200')).toBeInTheDocument()
  })
})
