import { useCallback, useEffect, useRef, useState } from 'react'
import { EDITOR_TOUR_STEPS } from '../components/EditorTour/editorTour.steps'

const STORAGE_KEY = 'resume-studio:editor-tour:v1'

export function useEditorTour(ready: boolean) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const checked = useRef(false)

  useEffect(() => {
    if (!ready || checked.current) return
    checked.current = true
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== 'seen')
    } catch {
      // With storage disabled, keep the editor usable and the manual tour available.
    }
  }, [ready])

  const start = useCallback(() => {
    setCurrent(0)
    setOpen(true)
  }, [])
  const goToStep = useCallback((index: number) => {
    setCurrent(Math.max(0, Math.min(EDITOR_TOUR_STEPS.length - 1, index)))
  }, [])
  const close = useCallback(() => {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'seen')
    } catch {
      // Onboarding must never block editing in private/restricted environments.
    }
  }, [])

  const isOpen = ready && open
  return { isOpen, current, step: isOpen ? EDITOR_TOUR_STEPS[current].id : undefined, start, close, goToStep }
}
