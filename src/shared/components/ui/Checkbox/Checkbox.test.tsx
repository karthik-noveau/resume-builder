import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders label connected to checkbox', () => {
    render(<Checkbox label="Show profile image" />)
    expect(screen.getByLabelText('Show profile image')).toBeInTheDocument()
  })

  it('calls onChange when toggled', async () => {
    const handler = vi.fn()
    render(<Checkbox label="Enable feature" onChange={handler} />)
    await userEvent.click(screen.getByLabelText('Enable feature'))
    expect(handler).toHaveBeenCalled()
  })

  it('reflects checked state', () => {
    render(<Checkbox label="Checked" checked onChange={() => {}} />)
    expect(screen.getByLabelText('Checked')).toBeChecked()
  })

  it('shows error message', () => {
    render(<Checkbox label="Accept" error="You must accept" />)
    expect(screen.getByRole('alert')).toHaveTextContent('You must accept')
  })
})
