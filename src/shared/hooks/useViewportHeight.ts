import { useEffect } from 'react'

/** Keep fixed editor shells inside the visible area when a phone keyboard opens. */
export function useViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    const previous = root.style.getPropertyValue('--app-viewport-height')
    const previousCompact = root.getAttribute('data-compact-viewport')
    let frame = 0
    const update = () => {
      // Pinch zoom must remain native; do not resize the document around it.
      if (viewport && viewport.scale !== 1) return
      const height = viewport?.height ?? window.innerHeight
      root.style.setProperty('--app-viewport-height', `${height}px`)
      root.toggleAttribute('data-compact-viewport', height < 600)
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const active = document.activeElement
        if (active instanceof HTMLElement && active.matches('input, textarea, [contenteditable="true"]')) {
          active.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
        }
      })
    }
    update()
    viewport?.addEventListener('resize', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(frame)
      if (previous) root.style.setProperty('--app-viewport-height', previous)
      else root.style.removeProperty('--app-viewport-height')
      if (previousCompact !== null) root.setAttribute('data-compact-viewport', previousCompact)
      else root.removeAttribute('data-compact-viewport')
    }
  }, [])
}
