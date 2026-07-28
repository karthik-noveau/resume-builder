import { useCallback } from 'react'
import { useEditorStore } from '@/shared/stores/editor.store'
import { useResumeStore } from '@/shared/stores/resume.store'

export function useUndoRedo() {
  const canUndo = useEditorStore((s) => s.undoStack.length > 0)
  const canRedo = useEditorStore((s) => s.redoStack.length > 0)

  const handleUndo = useCallback(() => {
    const { activeResume } = useResumeStore.getState()
    const { undoStack } = useEditorStore.getState()
    if (!activeResume || undoStack.length === 0) return

    const [snapshot, ...restUndo] = undoStack
    useEditorStore.setState((s) => ({
      undoStack: restUndo,
      redoStack: [activeResume, ...s.redoStack],
    }))
    useResumeStore.setState({ activeResume: snapshot, isDirty: true })
  }, [])

  const handleRedo = useCallback(() => {
    const { activeResume } = useResumeStore.getState()
    const { redoStack } = useEditorStore.getState()
    if (!activeResume || redoStack.length === 0) return

    const [snapshot, ...restRedo] = redoStack
    useEditorStore.setState((s) => ({
      redoStack: restRedo,
      undoStack: [activeResume, ...s.undoStack],
    }))
    useResumeStore.setState({ activeResume: snapshot, isDirty: true })
  }, [])

  return { handleUndo, handleRedo, canUndo, canRedo }
}
