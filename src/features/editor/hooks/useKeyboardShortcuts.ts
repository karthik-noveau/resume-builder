import { useEffect, useCallback } from 'react'

interface ShortcutHandlers {
  enabled?: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onEscape: () => void
  onDelete?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
}

export function useKeyboardShortcuts({
  enabled = true,
  onUndo,
  onRedo,
  onSave,
  onEscape,
  onDelete,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return
      const isMac = /mac/i.test(navigator.platform)
      const ctrl = isMac ? e.metaKey : e.ctrlKey
      const target = e.target instanceof Element ? e.target : document.activeElement
      const editing = !!target?.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""]'
      )
      // Keep native text undo and modal keyboard navigation independent of the canvas.
      if (target?.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return
      if (editing && !(ctrl && e.key.toLowerCase() === 's')) return
      const key = e.key.toLowerCase()

      if (ctrl && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo()
      } else if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault()
        onRedo()
      } else if (ctrl && e.key === 's') {
        e.preventDefault()
        onSave()
      } else if (ctrl && (e.key === '=' || e.key === '+') && onZoomIn) {
        e.preventDefault()
        onZoomIn()
      } else if (ctrl && e.key === '-' && onZoomOut) {
        e.preventDefault()
        onZoomOut()
      } else if (ctrl && e.key === '0' && onResetZoom) {
        e.preventDefault()
        onResetZoom()
      } else if (e.key === 'Escape') {
        onEscape()
      } else if (e.key === 'Delete' && onDelete) {
        const active = document.activeElement?.tagName
        if (
          active !== 'INPUT' &&
          active !== 'TEXTAREA' &&
          !document.activeElement?.hasAttribute('contenteditable')
        ) {
          onDelete()
        }
      }
    },
    [onUndo, onRedo, onSave, onEscape, onDelete, onZoomIn, onZoomOut, onResetZoom]
  )

  useEffect(() => {
    if (!enabled) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
