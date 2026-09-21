import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useViewportHeight } from './useViewportHeight'

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.style.removeProperty('--app-viewport-height')
})

describe('useViewportHeight', () => {
  it('tracks visible keyboard space, ignores pinch zoom, and cleans up', () => {
    const viewport = Object.assign(new EventTarget(), { height: 844, scale: 1 })
    vi.stubGlobal('visualViewport', viewport)
    const { unmount } = renderHook(() => useViewportHeight())
    const height = () => document.documentElement.style.getPropertyValue('--app-viewport-height')
    expect(height()).toBe('844px')
    act(() => { viewport.height = 360; viewport.dispatchEvent(new Event('resize')) })
    expect(height()).toBe('360px')
    expect(document.documentElement).toHaveAttribute('data-compact-viewport')
    act(() => { viewport.scale = 2; viewport.height = 180; viewport.dispatchEvent(new Event('resize')) })
    expect(height()).toBe('360px')
    unmount()
    expect(height()).toBe('')
    expect(document.documentElement).not.toHaveAttribute('data-compact-viewport')
    viewport.dispatchEvent(new Event('resize'))
    expect(height()).toBe('')
  })

  it('falls back to window height when VisualViewport is unavailable', () => {
    vi.stubGlobal('visualViewport', undefined)
    vi.stubGlobal('innerHeight', 568)
    const { unmount } = renderHook(() => useViewportHeight())
    expect(document.documentElement.style.getPropertyValue('--app-viewport-height')).toBe('568px')
    unmount()
  })
})
