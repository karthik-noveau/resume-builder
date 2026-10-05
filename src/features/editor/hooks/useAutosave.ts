import { useEffect, useRef } from 'react'
import { useResumeStore } from '@/shared/stores/resume.store'
import { checkpointResumeDraft } from '@/shared/services/resumeDraft.service'

const DEBOUNCE_MS = 1000

export function useAutosave() {
  const isDirty = useResumeStore((s) => s.isDirty)
  const isSaving = useResumeStore((s) => s.isSaving)
  const error = useResumeStore((s) => s.error)
  const activeResume = useResumeStore((s) => s.activeResume)
  const saveActiveResume = useResumeStore((s) => s.saveActiveResume)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || isSaving || error) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      void saveActiveResume()
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, isSaving, error, activeResume, saveActiveResume])

  /**
   * Writes out any edit still sitting inside the debounce window.
   *
   * Without this the effect above merely cancels its timer on unmount, so
   * leaving the editor within a second of typing — Back to dashboard,
   * switching to guided setup, closing the tab — silently discarded the edit,
   * despite the UI promising that every change saves automatically.
   *
   * State is read through getState() rather than the closure so the handlers
   * always see current values, not the ones captured when they were attached.
   */
  useEffect(() => {
    const flush = () => {
      // Forms and inline canvas fields commit on blur. A keyboard reload or
      // tab close can otherwise bypass blur and leave the store looking clean.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      const { activeResume: resume, isDirty: dirty, saveActiveResume: save } = useResumeStore.getState()
      if (dirty && resume) {
        checkpointResumeDraft(resume)
        void save()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flush)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      flush()
      if (!useResumeStore.getState().isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', beforeUnload)
      // Unmount (in-app navigation) — the one case we can always complete.
      flush()
    }
  }, [])
}
