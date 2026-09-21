import { createContext, useContext, useEffect } from 'react'
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form'

export type GuidedFormSave = () => Promise<boolean>

export const GuidedFormContext = createContext<{
  showErrors: boolean
  registerSave: (save: GuidedFormSave) => () => void
  saveForms: () => Promise<boolean>
} | null>(null)

/** Flushes the current draft before navigation, including the still-focused field. */
export function useGuidedForm<T extends FieldValues>(form: UseFormReturn<T>, onSave: SubmitHandler<T>) {
  const context = useContext(GuidedFormContext)
  const registerSave = context?.registerSave
  const { handleSubmit, formState: { isDirty } } = form

  useEffect(() => registerSave?.(async () => {
    let valid = false
    await handleSubmit(async (data) => {
      if (isDirty) await onSave(data)
      valid = true
    })()
    return valid
  }), [registerSave, handleSubmit, isDirty, onSave])

  return context
}
