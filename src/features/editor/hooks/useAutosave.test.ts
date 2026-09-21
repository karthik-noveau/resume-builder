import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAutosave } from './useAutosave'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'

const originalSave = useResumeStore.getState().saveActiveResume
beforeEach(() => {
  vi.useFakeTimers()
  useResumeStore.setState({
    activeResume: createSampleResume('meridian'),
    isDirty: false,
    isSaving: false,
    error: null,
    saveActiveResume: vi.fn().mockResolvedValue(undefined),
  })
})
afterEach(() => {
  useResumeStore.setState({ isDirty: false, saveActiveResume: originalSave })
  vi.useRealTimers()
})

it('debounces from the latest edit, rather than the first dirty flag', () => {
  renderHook(() => useAutosave())
  act(() => useResumeStore.getState().updateSummary('First change'))
  act(() => {
    vi.advanceTimersByTime(800)
  })
  act(() => useResumeStore.getState().updateSummary('Second change'))
  act(() => {
    vi.advanceTimersByTime(800)
  })
  expect(useResumeStore.getState().saveActiveResume).not.toHaveBeenCalled()
  act(() => {
    vi.advanceTimersByTime(200)
  })
  expect(useResumeStore.getState().saveActiveResume).toHaveBeenCalledOnce()
})

it('does not retry failed storage in an endless loop', () => {
  useResumeStore.setState({ isDirty: true, error: 'Failed to save resume' })
  renderHook(() => useAutosave())
  act(() => {
    vi.advanceTimersByTime(10000)
  })
  expect(useResumeStore.getState().saveActiveResume).not.toHaveBeenCalled()
})

it('flushes a newer draft even while another save is pending on unmount', () => {
  const { unmount } = renderHook(() => useAutosave())
  act(() => useResumeStore.setState({ isDirty: true, isSaving: true }))
  unmount()
  expect(useResumeStore.getState().saveActiveResume).toHaveBeenCalledOnce()
})

it('warns before closing a tab with unsaved changes', () => {
  renderHook(() => useAutosave())
  act(() => useResumeStore.setState({ isDirty: true }))
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})
