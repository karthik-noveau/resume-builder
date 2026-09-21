import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResumeStore } from './resume.store'
import { useEditorStore } from './editor.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'

// Mock the service layer — store tests verify state logic, not storage
vi.mock('@/shared/services/resume.service', () => ({
  resumeService: {
    getResumeList: vi.fn().mockResolvedValue([]),
    getResume: vi.fn(),
    createResume: vi.fn(),
    duplicateResume: vi.fn(),
    updateResume: vi.fn().mockResolvedValue(undefined),
    deleteResume: vi.fn().mockResolvedValue(undefined),
  },
}))

import { resumeService } from '@/shared/services/resume.service'

function resetStores() {
  useResumeStore.setState({
    activeResume: null,
    resumeList: [],
    isLoading: false,
    isSaving: false,
    isDirty: false,
    error: null,
  })
  useEditorStore.setState({ undoStack: [], redoStack: [] })
}

function loadResume() {
  const resume = createSampleResume('meridian')
  useResumeStore.setState({ activeResume: resume })
  return resume
}

describe('resumeStore', () => {
  beforeEach(resetStores)

  // ─── Load ───────────────────────────────────────────────────────────────────
  describe('loadResumeList', () => {
    it('fetches and stores resume list', async () => {
      const list = [createSampleResume('meridian')]
      vi.mocked(resumeService.getResumeList).mockResolvedValueOnce(list)
      await useResumeStore.getState().loadResumeList()
      expect(useResumeStore.getState().resumeList).toHaveLength(1)
    })

    it('sets error on failure', async () => {
      vi.mocked(resumeService.getResumeList).mockRejectedValueOnce(new Error('DB error'))
      await useResumeStore.getState().loadResumeList()
      expect(useResumeStore.getState().error).toBeTruthy()
    })
  })

  describe('loadResume', () => {
    it('loads a resume and clears undo history', async () => {
      const resume = createSampleResume('meridian')
      vi.mocked(resumeService.getResume).mockResolvedValueOnce(resume)
      useEditorStore.getState().pushUndoSnapshot(resume)

      await useResumeStore.getState().loadResume(resume.id)

      expect(useResumeStore.getState().activeResume?.id).toBe(resume.id)
      expect(useEditorStore.getState().undoStack).toHaveLength(0)
    })

    it('sets error when resume not found', async () => {
      vi.mocked(resumeService.getResume).mockResolvedValueOnce(undefined)
      await useResumeStore.getState().loadResume('missing-id')
      expect(useResumeStore.getState().error).toBeTruthy()
    })
  })

  // ─── Create / Delete ────────────────────────────────────────────────────────
  describe('createResume', () => {
    it('adds new resume to list', async () => {
      const resume = createSampleResume('meridian')
      vi.mocked(resumeService.createResume).mockResolvedValueOnce(resume)
      const id = await useResumeStore.getState().createResume('meridian')
      expect(id).toBe(resume.id)
      expect(useResumeStore.getState().resumeList).toHaveLength(1)
    })
  })

  describe('deleteResume', () => {
    it('removes resume from list', async () => {
      loadResume()
      useResumeStore.setState({ resumeList: [{ ...createSampleResume('meridian'), id: 'r1' }] })
      await useResumeStore.getState().deleteResume('r1')
      expect(useResumeStore.getState().resumeList).toHaveLength(0)
    })

    it('clears activeResume when deleting the active one', async () => {
      const resume = loadResume()
      useResumeStore.setState({ resumeList: [resume] })
      await useResumeStore.getState().deleteResume(resume.id)
      expect(useResumeStore.getState().activeResume).toBeNull()
    })
  })

  // ─── Update ─────────────────────────────────────────────────────────────────
  describe('updateResume', () => {
    it('updates the active resume title', () => {
      loadResume()
      useResumeStore.getState().updateResume({ title: 'New Title' })
      expect(useResumeStore.getState().activeResume?.title).toBe('New Title')
    })

    it('marks resume as dirty', () => {
      loadResume()
      useResumeStore.getState().updateResume({ title: 'Changed' })
      expect(useResumeStore.getState().isDirty).toBe(true)
    })

    it('pushes undo snapshot before updating', () => {
      const resume = loadResume()
      const originalTitle = resume.title
      useResumeStore.getState().updateResume({ title: 'Changed' })
      const snapshot = useEditorStore.getState().undoStack[0]
      expect(snapshot?.title).toBe(originalTitle)
    })

    it('does nothing when no active resume', () => {
      useResumeStore.getState().updateResume({ title: 'No-op' })
      expect(useResumeStore.getState().isDirty).toBe(false)
    })
  })

  // ─── Sections ───────────────────────────────────────────────────────────────
  describe('addSection', () => {
    it('adds an experience entry', () => {
      const resume = loadResume()
      const before = resume.experience.length
      useResumeStore.getState().addSection('experience')
      expect(useResumeStore.getState().activeResume?.experience).toHaveLength(before + 1)
    })

    it('adds a skill section', () => {
      const resume = loadResume()
      const before = resume.skills.length
      useResumeStore.getState().addSection('skills')
      expect(useResumeStore.getState().activeResume?.skills).toHaveLength(before + 1)
    })

    it('marks dirty after adding', () => {
      loadResume()
      useResumeStore.getState().addSection('projects')
      expect(useResumeStore.getState().isDirty).toBe(true)
    })
  })

  describe('deleteSection', () => {
    it('removes an experience entry by id', () => {
      const resume = loadResume()
      const before = resume.experience.length
      useResumeStore.getState().addSection('experience')
      const { experience } = useResumeStore.getState().activeResume!
      useResumeStore.getState().deleteSection('experience', experience[experience.length - 1].id)
      expect(useResumeStore.getState().activeResume?.experience).toHaveLength(before)
    })
  })

  describe('updateSection', () => {
    it('updates a field on an experience entry', () => {
      loadResume()
      useResumeStore.getState().addSection('experience')
      const { experience } = useResumeStore.getState().activeResume!
      const id = experience[0].id
      useResumeStore.getState().updateSection('experience', id, { company: 'Acme Corp' })
      const updated = useResumeStore.getState().activeResume?.experience.find((e) => e.id === id)
      expect(updated?.company).toBe('Acme Corp')
    })
  })

  // ─── Reorder ────────────────────────────────────────────────────────────────
  describe('reorderSections', () => {
    it('moves experience entry from index 0 to 1', () => {
      loadResume()
      useResumeStore.getState().addSection('experience')
      useResumeStore.getState().addSection('experience')

      const before = useResumeStore.getState().activeResume!.experience
      const firstId = before[0].id

      useResumeStore.getState().reorderSections('experience', 0, 1)

      const after = useResumeStore.getState().activeResume!.experience
      expect(after[1].id).toBe(firstId)
    })
  })

  describe('reorderSectionBlocks', () => {
    it('moves a section type in sectionOrder', () => {
      loadResume()
      const before = useResumeStore.getState().activeResume!.sectionOrder
      const firstType = before[0]

      useResumeStore.getState().reorderSectionBlocks(0, 1)

      const after = useResumeStore.getState().activeResume!.sectionOrder
      expect(after[1]).toBe(firstType)
    })
  })

  // ─── Save ───────────────────────────────────────────────────────────────────
  describe('saveActiveResume', () => {
    it('keeps newer edits dirty when an older autosave finishes', async () => {
      loadResume()
      useResumeStore.setState({ isDirty: true })
      let finishWrite!: () => void
      vi.mocked(resumeService.updateResume).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishWrite = () => resolve(useResumeStore.getState().activeResume!)
          })
      )
      const save = useResumeStore.getState().saveActiveResume()
      useResumeStore.getState().updateSummary('Newer summary')
      finishWrite()
      await save
      expect(useResumeStore.getState().isDirty).toBe(true)
    })

    it('waits for an older autosave before flushing the latest draft', async () => {
      loadResume()
      useResumeStore.setState({ isDirty: true })
      vi.mocked(resumeService.updateResume).mockClear()
      let finishWrite!: () => void
      vi.mocked(resumeService.updateResume).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishWrite = () => resolve(useResumeStore.getState().activeResume!)
          })
      )
      const first = useResumeStore.getState().saveActiveResume()
      useResumeStore.getState().updateSummary('Final summary before Finish')
      const flush = useResumeStore.getState().saveActiveResume()
      expect(resumeService.updateResume).toHaveBeenCalledTimes(1)
      finishWrite()
      await Promise.all([first, flush])
      expect(resumeService.updateResume).toHaveBeenCalledTimes(2)
      expect(vi.mocked(resumeService.updateResume).mock.calls[1][1].summary?.content).toBe(
        'Final summary before Finish'
      )
      expect(useResumeStore.getState().isDirty).toBe(false)
    })

    it('calls updateResume service and clears isDirty', async () => {
      loadResume()
      useResumeStore.setState({ isDirty: true })
      await useResumeStore.getState().saveActiveResume()
      expect(vi.mocked(resumeService.updateResume)).toHaveBeenCalled()
      expect(useResumeStore.getState().isDirty).toBe(false)
    })

    it('does not call service when not dirty', async () => {
      loadResume()
      vi.mocked(resumeService.updateResume).mockClear()
      await useResumeStore.getState().saveActiveResume()
      expect(vi.mocked(resumeService.updateResume)).not.toHaveBeenCalled()
    })

    it('clears a previous save error once a later save succeeds', async () => {
      loadResume()
      useResumeStore.setState({ isDirty: true, error: 'Failed to save resume' })
      await useResumeStore.getState().saveActiveResume()
      expect(useResumeStore.getState().error).toBeNull()
    })

    it('sets an error and keeps isDirty when the service call fails', async () => {
      loadResume()
      useResumeStore.setState({ isDirty: true })
      vi.mocked(resumeService.updateResume).mockRejectedValueOnce(new Error('network error'))
      await useResumeStore.getState().saveActiveResume()
      expect(useResumeStore.getState().error).toBe('Failed to save resume')
      expect(useResumeStore.getState().isDirty).toBe(true)
    })
  })
})

describe('navigation and persistence races', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })
  it('ignores an older load that resolves after the current route', async () => {
    const first = createSampleResume('meridian')
    const second = createSampleResume('atlas')
    let resolveFirst!: (resume: typeof first) => void
    vi.mocked(resumeService.getResume).mockImplementation((id) =>
      id === first.id
        ? new Promise((resolve) => {
            resolveFirst = resolve
          })
        : Promise.resolve(second)
    )
    const loadFirst = useResumeStore.getState().loadResume(first.id)
    await Promise.resolve()
    const loadSecond = useResumeStore.getState().loadResume(second.id)
    await loadSecond
    resolveFirst(first)
    await loadFirst
    expect(useResumeStore.getState().activeResume?.id).toBe(second.id)
  })
  it('saves a dirty draft before loading another resume', async () => {
    const first = loadResume()
    useResumeStore.getState().updateSummary('Keep this newest text')
    vi.mocked(resumeService.getResume).mockResolvedValueOnce(createSampleResume('atlas'))
    await useResumeStore.getState().loadResume('next')
    const saved = vi.mocked(resumeService.updateResume).mock.calls[0]
    expect(saved[0]).toBe(first.id)
    expect(saved[1].summary?.content).toBe('Keep this newest text')
    expect(resumeService.updateResume).toHaveBeenCalledBefore(vi.mocked(resumeService.getResume))
  })
  it('keeps unsaved content when a route switch cannot save', async () => {
    const first = loadResume()
    useResumeStore.getState().updateSummary('Unsaved work')
    vi.mocked(resumeService.updateResume).mockRejectedValueOnce(new Error('Quota exceeded'))
    await useResumeStore.getState().loadResume('next')
    expect(useResumeStore.getState().activeResume?.id).toBe(first.id)
    expect(useResumeStore.getState().isDirty).toBe(true)
    expect(resumeService.getResume).not.toHaveBeenCalled()
  })
})
