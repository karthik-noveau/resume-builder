import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders label connected to input', () => {
    render(<Input label="Email address" />)
    const input = screen.getByLabelText('Email address')
    expect(input).toBeInTheDocument()
  })

  it('calls onChange with new value', async () => {
    const handler = vi.fn()
    render(<Input label="Name" onChange={handler} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Alice')
    expect(handler).toHaveBeenCalled()
  })

  it('shows error message with role="alert"', () => {
    render(<Input label="Email" error="Invalid email address" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Invalid email address')
  })

  it('marks input as invalid when error is present', () => {
    render(<Input label="Email" error="Required" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows helper text when no error', () => {
    render(<Input label="Username" helperText="Must be at least 3 characters" />)
    expect(screen.getByText('Must be at least 3 characters')).toBeInTheDocument()
  })

  it('hides helper text when error is shown', () => {
    render(<Input label="Username" helperText="Helper" error="Error" />)
    expect(screen.queryByText('Helper')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Error')
  })

  it('shows character count when showCharacterCount and maxLength are set', () => {
    render(<Input label="Bio" value="Hello" showCharacterCount maxLength={100} onChange={() => {}} />)
    expect(screen.getByText('5/100')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Input label="Name" disabled />)
    expect(screen.getByLabelText('Name')).toBeDisabled()
  })
})
