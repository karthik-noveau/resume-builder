import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { useResumeStore } from '@/shared/stores/resume.store'
import { TemplateGallery } from './TemplateGallery'

vi.mock('@/shared/components/ResumePreview/ResumePreview', () => ({ ResumePreview: () => null }))
vi.mock('@/shared/utils/templatePreview', () => ({ getTemplatePreviewTree: () => null }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const createResume = vi.fn()

function setup(url = '/templates') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/templates" element={<TemplateGallery />} />
        <Route path="/editor/:id/guided" element={<div>Resume editor</div>} />
      </Routes>
    </MemoryRouter>
  )
  return userEvent.setup()
}

describe('direct template creation', () => {
  beforeEach(() => {
    createResume.mockReset().mockResolvedValue('new-resume')
    useResumeStore.setState({ createResume })
  })

  it('creates and opens a resume in one click without a confirmation bar', async () => {
    const user = setup()
    expect(createResume).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Create Resume' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use Horizon template' }))
    expect(createResume).toHaveBeenCalledExactlyOnceWith('horizon')
    expect(await screen.findByText('Resume editor')).toBeInTheDocument()
  })

  it('puts a home-page choice first without creating anything on arrival', () => {
    setup('/templates?create=true&template=horizon')
    expect(screen.getAllByRole('button', { name: /^Use .+ template$/ })[0]).toHaveAccessibleName(
      'Use Horizon template'
    )
    expect(createResume).not.toHaveBeenCalled()
  })

  it('prevents duplicate creation while the first choice is loading', async () => {
    let finish!: (id: string) => void
    createResume.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        finish = resolve
      })
    )
    const user = setup()
    const choice = screen.getByRole('button', { name: 'Use Horizon template' })
    await user.dblClick(choice)
    expect(choice).toHaveTextContent('Creating…')
    expect(choice).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Use Clarity template' }))
    expect(createResume).toHaveBeenCalledExactlyOnceWith('horizon')
    act(() => finish('new-resume'))
    expect(await screen.findByText('Resume editor')).toBeInTheDocument()
  })

  it('allows retry after creation fails', async () => {
    createResume.mockRejectedValueOnce(new Error('Storage unavailable'))
    const user = setup()
    const choice = screen.getByRole('button', { name: 'Use Horizon template' })
    await user.click(choice)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to create resume'))
    expect(choice).toBeEnabled()
    await user.click(choice)
    expect(createResume).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Resume editor')).toBeInTheDocument()
  })
})
