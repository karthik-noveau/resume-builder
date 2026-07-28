import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResumeStore } from './resume.store'
import { useEditorStore } from './editor.store'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'

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
  const resume = createEmptyResume('meridian')
  useResumeStore.setState({ activeResume: resume })
  return resume
}

describe('resumeStore', () => {
  beforeEach(resetStores)

  // ─── Load ───────────────────────────────────────────────────────────────────
  describe('loadResumeList', () => {
    it('fetches and stores resume list', async () => {
      const list = [createEmptyResume('meridian')]
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
      const resume = createEmptyResume('meridian')
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
      const resume = createEmptyResume('meridian')
      vi.mocked(resumeService.createResume).mockResolvedValueOnce(resume)
      const id = await useResumeStore.getState().createResume('meridian')
      expect(id).toBe(resume.id)
      expect(useResumeStore.getState().resumeList).toHaveLength(1)
    })
  })

  describe('deleteResume', () => {
    it('removes resume from list', async () => {
      loadResume()
      useResumeStore.setState({ resumeList: [{ ...createEmptyResume('meridian'), id: 'r1' }] })
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
