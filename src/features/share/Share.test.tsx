import { StrictMode } from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { ShareButton } from './ShareButton'
import { SharedResumePage } from './SharedResumePage'
import { createShareLink, importSharedResume } from './share.service'

vi.mock('./share.service', () => ({ createShareLink: vi.fn(), importSharedResume: vi.fn() }))
const link = 'https://resume.example/share#resume=v1.snapshot'
beforeAll(() => {
  const computedStyle = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => computedStyle(element))
})
beforeEach(() => {
  vi.clearAllMocks()
  useResumeStore.setState({ activeResume: createSampleResume('mosaic'), isDirty: false })
  vi.mocked(createShareLink).mockResolvedValue(link)
  vi.mocked(importSharedResume).mockResolvedValue('new-resume-id')
})

function Destination() {
  const location = useLocation()
  return (
    <p>
      Loaded {location.pathname}
      {location.hash}
    </p>
  )
}
function renderSharedPage() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/share#resume=v1.snapshot']}>
        <Routes>
          <Route path="/share" element={<SharedResumePage />} />
          <Route path="/editor/:id" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  )
}

describe('sharing a resume', () => {
  it('includes the last edited field, displays the generated link and copies it', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const resume = useResumeStore.getState().activeResume!
    render(
      <>
        <input
          aria-label="Draft name"
          defaultValue={resume.personalInfo.fullName}
          onBlur={(event) =>
            useResumeStore.getState().updatePersonalInfo({ fullName: event.target.value })
          }
        />
        <ShareButton resumeId={resume.id} />
      </>
    )
    await user.clear(screen.getByLabelText('Draft name'))
    await user.type(screen.getByLabelText('Draft name'), 'Fresh unsaved name')
    await user.click(screen.getByRole('button', { name: 'Share resume' }))
    const input = await screen.findByRole('textbox', { name: 'Share link' })
    expect(input).toHaveValue(link)
    expect(vi.mocked(createShareLink).mock.calls[0][0].personalInfo.fullName).toBe(
      'Fresh unsaved name'
    )
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(copy).toHaveBeenCalledWith(link)
    expect(await screen.findByText('Link copied. Ready to share.')).toBeInTheDocument()
    expect(importSharedResume).not.toHaveBeenCalled()
  })

  it('keeps the link selectable if clipboard access is unavailable', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'))
    render(<ShareButton resumeId={useResumeStore.getState().activeResume!.id} />)
    await user.click(screen.getByRole('button', { name: 'Share resume' }))
    await user.click(await screen.findByRole('button', { name: 'Copy link' }))
    expect(await screen.findByText('Copy the selected link manually.')).toBeInTheDocument()
    const input = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Share link' })
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(link.length)
  })

  it('shows generation errors and supports retry without displaying a stale link', async () => {
    const user = userEvent.setup()
    vi.mocked(createShareLink).mockRejectedValueOnce(new Error('Photo unavailable'))
    render(<ShareButton resumeId={useResumeStore.getState().activeResume!.id} />)
    await user.click(screen.getByRole('button', { name: 'Share resume' }))
    expect(await screen.findByText('Photo unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Share link' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('textbox', { name: 'Share link' })).toHaveValue(link)
  })
})

describe('opening a shared URL', () => {
  it('automatically imports exactly once in Strict Mode and opens the local editor', async () => {
    renderSharedPage()
    expect(await screen.findByText('Loaded /editor/new-resume-id')).toBeInTheDocument()
    expect(importSharedResume).toHaveBeenCalledTimes(1)
    expect(importSharedResume).toHaveBeenCalledWith('#resume=v1.snapshot')
  })

  it('keeps a failed link recoverable and retries without navigating to an empty editor', async () => {
    const user = userEvent.setup()
    vi.mocked(importSharedResume).mockRejectedValueOnce(
      new Error('Allow site storage, then try again.')
    )
    renderSharedPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Allow site storage')
    expect(screen.queryByText(/Loaded/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(screen.getByText('Loaded /editor/new-resume-id')).toBeInTheDocument()
    )
    expect(importSharedResume).toHaveBeenCalledTimes(2)
  })
})
