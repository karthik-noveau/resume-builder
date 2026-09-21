import { act, renderHook } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useEditorTour } from './useEditorTour'

const key = 'resume-studio:editor-tour:v1'

describe('editor quick tour', () => {
  beforeEach(() => localStorage.removeItem(key))
  afterEach(() => vi.restoreAllMocks())

  it('waits for a populated, ready editor before starting', () => {
    const { result, rerender } = renderHook(({ ready }) => useEditorTour(ready), { initialProps: { ready: false } })
    expect(result.current.isOpen).toBe(false)
    rerender({ ready: true })
    expect(result.current.isOpen).toBe(true)
  })

  it('remembers closing/skipping/completing and permits a manual replay', () => {
    const first = renderHook(() => useEditorTour(true))
    act(() => first.result.current.close())
    expect(first.result.current.isOpen).toBe(false)
    expect(localStorage.getItem(key)).toBe('seen')
    first.unmount()
    const next = renderHook(() => useEditorTour(true))
    expect(next.result.current.isOpen).toBe(false)
    act(() => next.result.current.start())
    expect(next.result.current.isOpen).toBe(true)
  })

  it('does not restart on layout recalculation', () => {
    const { result, rerender } = renderHook(({ ready }) => useEditorTour(ready), { initialProps: { ready: true } })
    act(() => result.current.close())
    rerender({ ready: false })
    rerender({ ready: true })
    expect(result.current.isOpen).toBe(false)
  })

  it('exposes only a temporary panel preview and resets to the first step on replay', () => {
    const { result } = renderHook(() => useEditorTour(true))
    act(() => result.current.goToStep(3))
    expect(result.current.step).toBe('global-design')
    act(() => result.current.close())
    expect(result.current.step).toBeUndefined()
    act(() => result.current.start())
    expect(result.current.step).toBe('template')
    expect(result.current.current).toBe(0)
  })

  it('still supports manual help when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    const { result } = renderHook(() => useEditorTour(true))
    expect(result.current.isOpen).toBe(false)
    act(() => result.current.start())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })
})
