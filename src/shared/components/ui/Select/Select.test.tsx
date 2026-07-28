import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Select } from './Select'

const options = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]

describe('Select', () => {
  it('renders label connected to select', () => {
    render(<Select label="Page size" options={options} />)
    expect(screen.getByRole('combobox', { name: 'Page size' })).toBeInTheDocument()
  })

  it('renders all options when opened', async () => {
    render(<Select label="Page size" options={options} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Page size' }))
    expect(screen.getByText('A4')).toBeInTheDocument()
    expect(screen.getByText('Letter')).toBeInTheDocument()
  })

  it('calls onChange when selection changes', async () => {
    const handler = vi.fn()
    render(<Select label="Page size" options={options} onChange={handler} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Page size' }))
    await userEvent.click(screen.getByText('Letter'))
    expect(handler).toHaveBeenCalledWith({ target: { name: undefined, value: 'letter' } })
  })

  it('shows error message', () => {
    render(<Select label="Page size" options={options} error="Selection required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Selection required')
  })
})
