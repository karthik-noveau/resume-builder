import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { checkpointResumeDraft, recoverResumeDraft } from '@/shared/services/resumeDraft.service'
import { useEditorStore } from '@/shared/stores/editor.store'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useUndoRedo } from './useUndoRedo'

afterEach(() => {
  vi.useRealTimers()
  sessionStorage.clear()
  act(() => {
    useEditorStore.getState().clearHistory()
    useResumeStore.setState({ activeResume: null, isDirty: false })
  })
})

it('recovers undo and redo as new edits instead of discarding their historical timestamps', () => {
  vi.useFakeTimers()
  const saved = { ...createSampleResume('meridian'), title: 'Current title', updatedAt: '2026-01-01T00:00:01.000Z' }
  const previous = { ...saved, title: 'Earlier title', updatedAt: '2026-01-01T00:00:00.000Z' }
  useResumeStore.setState({ activeResume: saved, isDirty: false })
  useEditorStore.setState({ undoStack: [previous], redoStack: [] })
  const { result } = renderHook(() => useUndoRedo())

  vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'))
  act(() => result.current.handleUndo())
  const undone = useResumeStore.getState().activeResume!
  checkpointResumeDraft(undone)
  expect(recoverResumeDraft(saved)?.title).toBe('Earlier title')

  vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'))
  act(() => result.current.handleRedo())
  const redone = useResumeStore.getState().activeResume!
  checkpointResumeDraft(redone)
  expect(recoverResumeDraft(undone)?.title).toBe('Current title')
  expect(useResumeStore.getState().isDirty).toBe(true)
})
