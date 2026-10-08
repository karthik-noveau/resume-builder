import type { ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

/** Animate disclosure height without leaving closed fields in the tab order. */
export function Collapse({ open, instant = false, children }: { open: boolean; instant?: boolean; children: ReactNode }) {
  // Tour spotlights measure their targets immediately after the panel opens.
  if (instant) return open ? <div>{children}</div> : null
  return (
    <AnimatePresence initial={false}>
      {open && <CollapseBody>{children}</CollapseBody>}
    </AnimatePresence>
  )
}

function CollapseBody({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden' }}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
    >
      {children}
    </motion.div>
  )
}
