import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ResumeCard } from './ResumeCard'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'

const mockResume = {
  ...createEmptyResume('meridian'),
  id: 'r1',
  title: 'My Developer Resume',
  updatedAt: '2024-01-15T10:00:00.000Z',
  createdAt: '2024-01-01T10:00:00.000Z',
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <ResumeCard
        resume={mockResume}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('ResumeCard', () => {
  it('renders resume title', () => {
    renderCard()
    expect(screen.getByText('My Developer Resume')).toBeInTheDocument()
  })

  it('shows actions menu when menu button clicked', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Resume actions' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('calls onDuplicate with resume id when duplicate clicked', async () => {
    const onDuplicate = vi.fn()
    renderCard({ onDuplicate })
    await userEvent.click(screen.getByRole('button', { name: 'Resume actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /duplicate/i }))
    expect(onDuplicate).toHaveBeenCalledWith('r1')
  })

  it('calls onDelete with resume id when delete clicked', async () => {
    const onDelete = vi.fn()
    renderCard({ onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Resume actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('r1')
  })

  it('has accessible article label', () => {
    renderCard()
    expect(screen.getByRole('article', { name: /open resume: my developer resume/i })).toBeInTheDocument()
  })
})
