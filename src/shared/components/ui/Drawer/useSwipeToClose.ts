import { useEffect } from 'react'

const INTERACTIVE_GESTURES = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="slider"]',
  '[role="combobox"]',
  '[data-drag-handle]',
  '[data-swipe-ignore]',
].join(',')

/** Recognize deliberate horizontal swipes without taking over vertical scrolling. */
export function useSwipeToClose(
  panel: HTMLDivElement | null,
  isOpen: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!panel || !isOpen) return
    let gesture: { id: number; x: number; y: number; horizontal: boolean } | null = null

    const cancel = () => {
      gesture = null
    }
    const start = (event: TouchEvent) => {
      cancel()
      if (event.touches.length !== 1 || !(event.target instanceof Element)) return
      if (event.target.closest(INTERACTIVE_GESTURES)) return
      // A horizontal scroller owns its gesture, even when it is inside the drawer.
      for (
        let node: Element | null = event.target;
        node && node !== panel;
        node = node.parentElement
      ) {
        if (
          node.scrollWidth > node.clientWidth &&
          /auto|scroll/.test(getComputedStyle(node).overflowX)
        )
          return
      }
      const touch = event.touches[0]
      gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, horizontal: false }
    }

    const move = (event: TouchEvent) => {
      if (!gesture) return
      if (event.touches.length !== 1 || window.getSelection()?.type === 'Range') {
        cancel()
        return
      }
      const touch = Array.from(event.touches).find((item) => item.identifier === gesture?.id)
      if (!touch) return cancel()
      const dx = Math.abs(touch.clientX - gesture.x)
      const dy = Math.abs(touch.clientY - gesture.y)
      if (!gesture.horizontal) {
        if (dy >= 10 && dy * 1.5 >= dx) return cancel()
        if (dx < 12 || dx < dy * 1.5) return
        gesture.horizontal = true
      }
      // Prevent a recognized swipe from also scrolling or tapping a section row.
      if (event.cancelable) event.preventDefault()
    }

    const end = (event: TouchEvent) => {
      const completed = gesture
      cancel()
      if (!completed?.horizontal || event.touches.length !== 0) return
      const touch = Array.from(event.changedTouches).find(
        (item) => item.identifier === completed.id
      )
      if (!touch) return
      const dx = Math.abs(touch.clientX - completed.x)
      const dy = Math.abs(touch.clientY - completed.y)
      if (event.cancelable) event.preventDefault()
      if (dx >= 64 && dx > dy * 1.5) onClose()
    }

    panel.addEventListener('touchstart', start, { passive: true })
    panel.addEventListener('touchmove', move, { passive: false })
    panel.addEventListener('touchend', end, { passive: false })
    panel.addEventListener('touchcancel', cancel, { passive: true })
    return () => {
      panel.removeEventListener('touchstart', start)
      panel.removeEventListener('touchmove', move)
      panel.removeEventListener('touchend', end)
      panel.removeEventListener('touchcancel', cancel)
    }
  }, [panel, isOpen, onClose])
}
