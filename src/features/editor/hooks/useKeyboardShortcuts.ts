import { useEffect, useCallback } from 'react'

interface ShortcutHandlers {
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
      const isMac = /mac/i.test(navigator.platform)
      const ctrl = isMac ? e.metaKey : e.ctrlKey

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo()
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
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
        if (active !== 'INPUT' && active !== 'TEXTAREA' && !document.activeElement?.hasAttribute('contenteditable')) {
          onDelete()
        }
      }
    },
    [onUndo, onRedo, onSave, onEscape, onDelete, onZoomIn, onZoomOut, onResetZoom]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
