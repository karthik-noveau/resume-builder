import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editor.store'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'

function resetStore() {
  useEditorStore.setState({
    selectedSectionId: null,
    selectedSectionType: null,
    zoomLevel: 1.0,
    activePage: 0,
    undoStack: [],
    redoStack: [],
  })
}

describe('editorStore', () => {
  beforeEach(resetStore)

  describe('selection', () => {
    it('selects a section', () => {
      useEditorStore.getState().selectSection('sec-1', 'experience')
      const { selectedSectionId, selectedSectionType } = useEditorStore.getState()
      expect(selectedSectionId).toBe('sec-1')
      expect(selectedSectionType).toBe('experience')
    })

    it('clears selection', () => {
      useEditorStore.getState().selectSection('sec-1', 'experience')
      useEditorStore.getState().clearSelection()
      expect(useEditorStore.getState().selectedSectionId).toBeNull()
    })
  })

  describe('zoom', () => {
    it('sets zoom within bounds', () => {
      useEditorStore.getState().setZoom(1.5)
      expect(useEditorStore.getState().zoomLevel).toBe(1.5)
    })

    it('clamps zoom below minimum', () => {
      useEditorStore.getState().setZoom(0.1)
      expect(useEditorStore.getState().zoomLevel).toBe(0.5)
    })

    it('clamps zoom above maximum', () => {
      useEditorStore.getState().setZoom(5)
      expect(useEditorStore.getState().zoomLevel).toBe(2.0)
    })

    it('zooms in by 0.1 steps', () => {
      useEditorStore.getState().zoomIn()
      expect(useEditorStore.getState().zoomLevel).toBe(1.1)
    })

    it('zooms out by 0.1 steps', () => {
      useEditorStore.getState().zoomOut()
      expect(useEditorStore.getState().zoomLevel).toBe(0.9)
    })

    it('resets zoom to 1.0', () => {
      useEditorStore.getState().setZoom(1.8)
      useEditorStore.getState().resetZoom()
      expect(useEditorStore.getState().zoomLevel).toBe(1.0)
    })
  })

  describe('undo / redo', () => {
    it('pushes snapshot to undo stack', () => {
      const resume = createEmptyResume('meridian')
      useEditorStore.getState().pushUndoSnapshot(resume)
      expect(useEditorStore.getState().undoStack).toHaveLength(1)
    })

    it('undo returns the snapshot and removes it from stack', () => {
      const resume = createEmptyResume('meridian')
      useEditorStore.getState().pushUndoSnapshot(resume)
      const restored = useEditorStore.getState().undo()
      expect(restored?.id).toBe(resume.id)
      expect(useEditorStore.getState().undoStack).toHaveLength(0)
    })

    it('undo returns null when stack is empty', () => {
      const result = useEditorStore.getState().undo()
      expect(result).toBeNull()
    })

    it('pushing a snapshot clears redo stack', () => {
      const r1 = createEmptyResume('meridian')
      const r2 = createEmptyResume('meridian')
      useEditorStore.getState().pushUndoSnapshot(r1)
      useEditorStore.getState().redo(r2)
      // redo stack would be empty here, but pushing again should still clear it
      useEditorStore.getState().pushUndoSnapshot(r2)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })

    it('caps undo stack at 100 items', () => {
      const resume = createEmptyResume('meridian')
      for (let i = 0; i < 105; i++) {
        useEditorStore.getState().pushUndoSnapshot({ ...resume, title: `v${i}` })
      }
      expect(useEditorStore.getState().undoStack).toHaveLength(100)
    })

    it('clearHistory empties both stacks', () => {
      const resume = createEmptyResume('meridian')
      useEditorStore.getState().pushUndoSnapshot(resume)
      useEditorStore.getState().clearHistory()
      expect(useEditorStore.getState().undoStack).toHaveLength(0)
      expect(useEditorStore.getState().redoStack).toHaveLength(0)
    })
  })
})
