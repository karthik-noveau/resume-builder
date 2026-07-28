import { useLayoutEffect, useRef } from 'react'

/** Grows a textarea's height to fit its content as the user types, instead of scrolling inside a fixed box. */
export function useAutoGrowTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return ref
}
