import { useEffect, useRef } from 'react'
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form'

/** Keep newer typing when our own blur-save returns; still accept mocks and undo. */
export function useResumeFormSync<T extends FieldValues>(
  form: UseFormReturn<T>, source: T, onSave: SubmitHandler<T>,
): SubmitHandler<T> {
  const lastSaved = useRef<T | null>(null)
  const { reset } = form
  // RHF subscribes to dirtyFields to support reset({ keepDirtyValues: true }).
  void form.formState.dirtyFields

  useEffect(() => {
    const saved = lastSaved.current
    const ownUpdate = saved !== null && Object.keys(saved).every((key) =>
      key === 'updatedAt' || JSON.stringify(source[key]) === JSON.stringify(saved[key]),
    )
    reset(source, { keepDirtyValues: ownUpdate, keepErrors: ownUpdate })
    lastSaved.current = null
  }, [source, reset])

  return (data, event) => {
    lastSaved.current = data
    return onSave(data, event)
  }
}
