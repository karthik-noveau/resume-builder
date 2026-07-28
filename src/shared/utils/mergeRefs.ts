import type { Ref, RefCallback } from 'react'

/** Combines multiple refs (callback or object) into one ref callback for a single element. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref && typeof ref === 'object') {
        (ref as { current: T | null }).current = value
      }
    }
  }
}
