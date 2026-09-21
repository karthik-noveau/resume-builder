import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ResumeCard } from './ResumeCard'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createShareLink } from '@/features/share/share.service'

vi.mock('@/features/share/share.service', () => ({ createShareLink: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

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
  it.each(['no active resume', 'another active resume'])(
    'shares the selected card with %s',
    async (state) => {
      const user = userEvent.setup()
      const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
      const activeResume = state === 'no active resume' ? null : createEmptyResume('mosaic')
      useResumeStore.setState({ activeResume })
      const link = 'https://resume.example/share#resume=v1.selected-card'
      vi.mocked(createShareLink).mockResolvedValue(link)
      renderCard()
      await user.click(screen.getByRole('button', { name: 'Actions for My Developer Resume' }))
      await user.click(screen.getByRole('menuitem', { name: 'Share' }))
      expect(await screen.findByRole('textbox', { name: 'Share link' })).toHaveValue(link)
      expect(createShareLink).toHaveBeenCalledWith(mockResume)
      expect(useResumeStore.getState().activeResume).toBe(activeResume)
      await user.click(screen.getByRole('button', { name: 'Copy link' }))
      expect(copy).toHaveBeenCalledWith(link)
      await user.click(screen.getByRole('button', { name: 'Close dialog' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }
  )

  it('renders resume title', () => {
    renderCard()
    expect(screen.getByText('My Developer Resume')).toBeInTheDocument()
  })

  it('shows actions menu when menu button clicked', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Actions for My Developer Resume' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('calls onDuplicate with resume id when duplicate clicked', async () => {
    const onDuplicate = vi.fn()
    renderCard({ onDuplicate })
    await userEvent.click(screen.getByRole('button', { name: 'Actions for My Developer Resume' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /duplicate/i }))
    expect(onDuplicate).toHaveBeenCalledWith('r1')
  })

  it('calls onDelete with resume id when delete clicked', async () => {
    const onDelete = vi.fn()
    renderCard({ onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Actions for My Developer Resume' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('r1')
  })

  it('provides a real keyboard-accessible link', () => {
    renderCard()
    expect(screen.getByRole('link', { name: /open resume: my developer resume/i })).toHaveAttribute(
      'href',
      '/editor/r1'
    )
  })
})

it('keeps a failed rename editable and supports Escape without committing', async () => {
  const onRename = vi.fn().mockRejectedValue(new Error('Storage unavailable'))
  renderCard({ onRename })
  await userEvent.click(screen.getByRole('button', { name: 'Actions for My Developer Resume' }))
  await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
  const input = screen.getByRole('textbox', { name: 'Resume title' })
  await userEvent.clear(input)
  await userEvent.type(input, 'New title{Enter}')
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t rename')
  expect(screen.getByRole('textbox')).toHaveValue('New title')
  await userEvent.click(input)
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(onRename).toHaveBeenCalledTimes(1)
})
