import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { LayoutTree } from '@/shared/types/layout.types'
import styles from './Canvas.module.css'

interface Props {
  canvasRef: RefObject<HTMLDivElement | null>
  layoutTree: LayoutTree | null
  selectionKey: string
  scale: number
}

type Box = Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>
const overlaps = (a: Box, b: Box) => a.left < b.right + 3 && a.right > b.left - 3
  && a.top < b.bottom + 3 && a.bottom > b.top - 3

/** One unscaled label for the hovered, focused or selected element. */
export function CanvasElementLabel({ canvasRef, layoutTree, selectionKey, scale }: Props) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const hovered = useRef<HTMLElement | null>(null)
  const focused = useRef<HTMLElement | null>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const label = target?.dataset.canvasLabel ?? null

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const current = (element: HTMLElement | null) => element && canvas.contains(element) ? element : null
    const update = () => setTarget(current(hovered.current) ?? current(focused.current)
      ?? canvas.querySelector<HTMLElement>('[data-canvas-selected]'))
    const closest = (event: Event) => event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-canvas-target]') : null
    const hover = (event: Event) => { hovered.current = closest(event); update() }
    const leave = () => { hovered.current = null; update() }
    const focus = (event: Event) => { focused.current = closest(event); update() }
    const blur = () => { focused.current = null; update() }
    update()
    canvas.addEventListener('pointermove', hover)
    canvas.addEventListener('pointerleave', leave)
    canvas.addEventListener('focusin', focus)
    canvas.addEventListener('focusout', blur)
    return () => {
      canvas.removeEventListener('pointermove', hover)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('focusin', focus)
      canvas.removeEventListener('focusout', blur)
    }
  }, [canvasRef, layoutTree, selectionKey])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const badge = labelRef.current
    if (!canvas || !badge || !target || !label) {
      setPosition(null)
      return
    }
    let frame = 0
    const measure = () => {
      const viewport = canvas.getBoundingClientRect()
      const element = target.getBoundingClientRect()
      if (!canvas.contains(target) || viewport.width === 0 || viewport.height === 0 || !overlaps(viewport, element)) {
        setPosition(null)
        return
      }
      const { width, height } = badge.getBoundingClientRect()
      const bounds = { left: viewport.left + 8, top: viewport.top + 8,
        right: viewport.right - 8, bottom: viewport.bottom - 8 }
      // Measure actual glyphs instead of their full-width layout boxes. A short
      // heading can leave plenty of room at the other end of its divider.
      const occupied: Box[] = []
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      while (walker.nextNode()) {
        const text = walker.currentNode
        if (!text.textContent?.trim()) continue
        range.selectNodeContents(text)
        for (const rect of range.getClientRects()) {
          if (rect.width && rect.height && overlaps(viewport, rect)) occupied.push(rect)
        }
      }
      for (const graphic of canvas.querySelectorAll('img, svg')) {
        const rect = graphic.getBoundingClientRect()
        if (rect.width && rect.height && overlaps(viewport, rect)) occupied.push(rect)
      }
      const gap = 7
      // Every candidate stays attached to the element. Canvas-edge fallbacks
      // made small contact labels appear hundreds of pixels from their fields.
      const xs = [element.left, element.right - width, (element.left + element.right - width) / 2,
        element.right + gap, element.left - width - gap]
      const ys = [element.top - height - gap, element.bottom + gap,
        Math.max(element.top + gap, bounds.top), Math.min(element.bottom - height - gap, bounds.bottom - height)]
      // Try above and below before one nearby alternate row. When crowded,
      // hide the badge instead of detaching it from its field.
      for (let offset = 0; offset < 2; offset++) {
        for (const y of ys) {
          const top = y + (y < element.top ? -1 : 1) * offset * (height + gap)
          if (top < bounds.top || top + height > bounds.bottom) continue
          for (const x of xs) {
            const left = Math.max(bounds.left, Math.min(x, bounds.right - width))
            const candidate = { left, top, right: left + width, bottom: top + height }
            const dx = Math.max(element.left - candidate.right, candidate.left - element.right, 0)
            const dy = Math.max(element.top - candidate.bottom, candidate.top - element.bottom, 0)
            if (Math.hypot(dx, dy) > 36) continue
            if (occupied.some((rect) => overlaps(candidate, rect))) continue
            const parent = canvas.parentElement!.getBoundingClientRect()
            setPosition({ left: left - parent.left, top: top - parent.top })
            return
          }
        }
      }
      setPosition(null)
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    canvas.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)
    observer.observe(target)
    return () => {
      cancelAnimationFrame(frame)
      canvas.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [canvasRef, target, label, layoutTree, selectionKey, scale])

  return <span ref={labelRef} className={styles.elementLabel} data-canvas-element-label=""
    data-label-target={target?.dataset.styleKey} aria-hidden="true"
    style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>
    {label}
  </span>
}
