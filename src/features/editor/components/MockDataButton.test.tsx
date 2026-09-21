import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createEmptyResume, createSampleResume } from '@/features/resume/utils/resume.factory'
import type { GuidedStep } from '../utils/guidedSetup'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { MockDataButton } from './MockDataButton'

describe('MockDataButton', () => {
  beforeEach(() => {
    useResumeStore.setState({ activeResume: createEmptyResume('meridian'), isDirty: false })
    useEditorStore.setState({ undoStack: [], redoStack: [] })
  })

  it('fills only personal details, preserves other sections and design, and enables autosave and undo', async () => {
    const original = useResumeStore.getState().activeResume!
    render(<MockDataButton step="personal" />)
    await userEvent.click(screen.getByRole('button', { name: 'Use mock data' }))

    const { activeResume, isDirty } = useResumeStore.getState()
    expect(activeResume?.personalInfo.fullName).toBe('Alex Morgan')
    expect(activeResume?.experience).toEqual([])
    expect(activeResume?.summary.content).toBe('')
    expect(activeResume).toMatchObject({
      id: original.id, title: original.title, createdAt: original.createdAt,
      templateId: original.templateId, settings: original.settings,
    })
    expect(isDirty).toBe(true)
    expect(useEditorStore.getState().undoStack).toEqual([original])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('leaves existing content untouched when replacement is cancelled', async () => {
    useResumeStore.getState().updatePersonalInfo({ fullName: 'Jordan Rivera' })
    const original = useResumeStore.getState().activeResume
    render(<MockDataButton step="personal" />)
    await userEvent.click(screen.getByRole('button', { name: 'Use mock data' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(useResumeStore.getState().activeResume).toEqual(original)
  })

  it('replaces existing content only after confirmation', async () => {
    useResumeStore.getState().updateSummary('My own summary')
    render(<MockDataButton step="summary" />)
    await userEvent.click(screen.getByRole('button', { name: 'Use mock data' }))
    expect(useResumeStore.getState().activeResume?.summary.content).toBe('My own summary')
    await userEvent.click(await screen.findByRole('button', { name: 'Replace with mock data' }))
    expect(useResumeStore.getState().activeResume?.personalInfo.fullName).toBe('')
    expect(useResumeStore.getState().activeResume?.summary.content).not.toBe('My own summary')
    expect(useEditorStore.getState().undoStack[0].summary.content).toBe('My own summary')
  })

  it.each(['personal', 'summary', 'experience', 'education', 'skills'] as GuidedStep[])(
    'replaces only %s and leaves every other section untouched', async (step) => {
      const original = createSampleResume('atlas')
      useResumeStore.setState({ activeResume: original })
      render(<MockDataButton step={step} />)
      await userEvent.click(screen.getByRole('button', { name: 'Use mock data' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Replace with mock data' }))

      const updated = useResumeStore.getState().activeResume!
      const key = step === 'personal' ? 'personalInfo' : step
      for (const section of ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'customSections'] as const) {
        if (section !== key) expect(updated[section]).toEqual(original[section])
      }
    },
  )

  it('does not ask to replace another section when the current section is blank', async () => {
    useResumeStore.getState().updatePersonalInfo({ fullName: 'Jordan Rivera' })
    render(<MockDataButton step="education" />)
    await userEvent.click(screen.getByRole('button', { name: 'Use mock data' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useResumeStore.getState().activeResume?.personalInfo.fullName).toBe('Jordan Rivera')
    expect(useResumeStore.getState().activeResume?.education.length).toBeGreaterThan(0)
  })
})
