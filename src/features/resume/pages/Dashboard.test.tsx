import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import { Dashboard } from './Dashboard'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'

vi.mock('@/shared/stores/resume.store', () => ({
  useResumeStore: vi.fn(),
}))

const mockStore = {
  resumeList: [],
  isLoading: false,
  loadResumeList: vi.fn().mockResolvedValue(undefined),
  createResume: vi.fn(),
  duplicateResume: vi.fn(),
  renameResume: vi.fn(),
  deleteResume: vi.fn(),
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/templates" element={<div>Template picker page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useResumeStore).mockImplementation((selector) =>
      selector(mockStore as unknown as Parameters<typeof selector>[0])
    )
  })

  it('renders the page heading', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: 'My Resumes' })).toBeInTheDocument()
  })

  it('shows empty state when no resumes', () => {
    renderDashboard()
    expect(screen.getByText('No resumes yet')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    vi.mocked(useResumeStore).mockImplementation((selector) =>
      selector({ ...mockStore, isLoading: true } as unknown as Parameters<typeof selector>[0])
    )
    renderDashboard()
    // Skeletons are aria-hidden, so check via container class
    const { container } = renderDashboard()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows resume cards when resumes exist', () => {
    const list = [{ ...createEmptyResume('meridian'), id: 'r1', title: 'My CV' }]
    vi.mocked(useResumeStore).mockImplementation((selector) =>
      selector({ ...mockStore, resumeList: list } as unknown as Parameters<typeof selector>[0])
    )
    renderDashboard()
    expect(screen.getByText('My CV')).toBeInTheDocument()
  })

  it('opens the template picker when New Resume is clicked', async () => {
    renderDashboard()
    await userEvent.click(screen.getByRole('button', { name: /create a new resume/i }))
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /choose a template/i })).toBeInTheDocument()
    )
  })

  it('only creates once the picked template is confirmed', async () => {
    mockStore.createResume.mockResolvedValue('new-id')
    renderDashboard()
    await userEvent.click(screen.getByRole('button', { name: /create a new resume/i }))

    const dialog = await screen.findByRole('dialog', { name: /choose a template/i })
    const confirm = within(dialog).getByRole('button', { name: /create resume/i })
    expect(confirm).toBeDisabled()

    await userEvent.click(within(dialog).getByRole('option', { name: /meridian/i }))
    expect(mockStore.createResume).not.toHaveBeenCalled()

    await userEvent.click(confirm)
    await waitFor(() => expect(mockStore.createResume).toHaveBeenCalledWith('meridian'))
  })

  it('calls loadResumeList on mount', () => {
    renderDashboard()
    expect(mockStore.loadResumeList).toHaveBeenCalled()
  })
})

it('shows a retryable load error instead of a misleading empty workspace', async () => {
  vi.mocked(useResumeStore).mockImplementation((selector) =>
    selector({ ...mockStore, error: 'Failed to load resumes' } as unknown as Parameters<
      typeof selector
    >[0])
  )
  renderDashboard()
  expect(screen.getByRole('alert')).toHaveTextContent('couldn’t load your workspace')
  expect(screen.queryByText('No resumes yet')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(mockStore.loadResumeList).toHaveBeenCalled()
})
