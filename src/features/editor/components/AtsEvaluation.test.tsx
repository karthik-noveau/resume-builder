import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { AtsEvaluation } from './AtsEvaluation'

function LiveEvaluation() {
  const resume = useResumeStore((state) => state.activeResume)
  return resume && <AtsEvaluation resume={resume} />
}

beforeAll(() => {
  const computedStyle = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => computedStyle(element))
})

beforeEach(() => {
  useResumeStore.setState({ activeResume: createSampleResume('mosaic'), isDirty: false })
  useEditorStore.setState({ undoStack: [], redoStack: [] })
  sessionStorage.clear()
})

describe('ATS review and fixes', () => {
  it('recalculates when contact data, image visibility, and template change', () => {
    const resume = createSampleResume('mosaic')
    const { rerender } = render(<AtsEvaluation resume={resume} />)
    const score = () =>
      Number(screen.getByRole('progressbar', { name: 'ATS score' }).getAttribute('aria-valuenow'))
    const initial = score()
    const missingContact = { ...resume, personalInfo: { ...resume.personalInfo, email: '' } }
    rerender(<AtsEvaluation resume={missingContact} />)
    expect(score()).toBeLessThan(initial)
    const beforeImage = score()
    const noImage = { ...missingContact, settings: { ...resume.settings, showProfileImage: false } }
    rerender(<AtsEvaluation resume={noImage} />)
    expect(score()).toBe(beforeImage + 2)
    rerender(<AtsEvaluation resume={{ ...noImage, templateId: 'meridian' }} />)
    expect(score()).toBe(beforeImage + 5)
  })

  it('previews a fix, applies one undoable change, and restores it with Undo', async () => {
    render(<LiveEvaluation />)
    await userEvent.click(screen.getByRole('button', { name: 'Review & fix' }))
    const dialog = await screen.findByRole(
      'dialog',
      { name: 'ATS review & fixes' },
      { timeout: 5000 }
    )
    const photoCheck = within(dialog)
      .getByRole('heading', { name: 'Profile graphics' })
      .closest('article')!
    await userEvent.click(within(photoCheck).getByRole('button', { name: 'Review fix' }))
    expect(within(dialog).getByText('Shown on resume')).toBeVisible()
    expect(useResumeStore.getState().activeResume!.settings.showProfileImage).toBe(true)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply fix' }))
    expect(useResumeStore.getState().activeResume!.settings.showProfileImage).toBe(false)
    expect(useEditorStore.getState().undoStack).toHaveLength(1)
    expect(
      within(dialog).queryByRole('heading', { name: 'Profile graphics' })
    ).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Undo' }))
    expect(useResumeStore.getState().activeResume!.settings.showProfileImage).toBe(true)
    expect(within(dialog).getByRole('heading', { name: 'Profile graphics' })).toBeVisible()
  })

  it('opens the relevant editor and updates the saved value and evaluation', async () => {
    const resume = useResumeStore.getState().activeResume!
    useResumeStore.setState({
      activeResume: { ...resume, personalInfo: { ...resume.personalInfo, email: '' } },
    })
    render(<LiveEvaluation />)
    await userEvent.click(screen.getByRole('button', { name: 'Review & fix' }))
    const dialog = await screen.findByRole(
      'dialog',
      { name: 'ATS review & fixes' },
      { timeout: 5000 }
    )
    const emailCheck = within(dialog)
      .getByRole('heading', { name: 'Email address' })
      .closest('article')!
    await userEvent.click(within(emailCheck).getByRole('button', { name: 'Edit details' }))
    const email = within(dialog).getByRole('textbox', { name: 'Email' })
    expect(email).toHaveFocus()
    fireEvent.change(email, { target: { value: 'alex@actual-domain.dev' } })
    fireEvent.blur(email)
    await waitFor(() =>
      expect(useResumeStore.getState().activeResume!.personalInfo.email).toBe(
        'alex@actual-domain.dev'
      )
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Back to evaluation' }))
    expect(within(dialog).queryByRole('heading', { name: 'Email address' })).not.toBeInTheDocument()
  })

  it('matches selected job keywords and scopes saved job text to the resume', async () => {
    render(<LiveEvaluation />)
    await userEvent.click(screen.getByRole('button', { name: 'Review & fix' }))
    const dialog = await screen.findByRole(
      'dialog',
      { name: 'ATS review & fixes' },
      { timeout: 5000 }
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Job match' }))
    fireEvent.change(within(dialog).getByLabelText('Job description'), {
      target: { value: 'We require SQL, Figma, and Python.' },
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Extract keywords' }))
    expect(within(dialog).getByLabelText('Keywords to compare')).toHaveValue('Python, SQL, Figma')
    expect(within(dialog).getByText('67%')).toBeVisible()
    const id = useResumeStore.getState().activeResume!.id
    const savedJob: unknown = JSON.parse(sessionStorage.getItem(`resume-studio:ats-job:${id}`)!)
    expect(savedJob).toMatchObject({ description: 'We require SQL, Figma, and Python.' })
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Clear job description and keywords' })
    )
    expect(within(dialog).getByLabelText('Job description')).toHaveValue('')
    expect(within(dialog).getByText('Extract or enter keywords to compare.')).toBeVisible()
  })

  it('avoids a fabricated score when a template is unavailable', () => {
    render(<AtsEvaluation resume={createSampleResume('missing-template')} />)
    expect(screen.getByText('Unavailable')).toBeVisible()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
