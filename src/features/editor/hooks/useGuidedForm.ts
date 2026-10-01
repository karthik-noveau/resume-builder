import { createContext, useContext, useEffect } from 'react'
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form'

export type GuidedFormSave = (validate?: boolean) => Promise<boolean>

export const GuidedFormContext = createContext<{
  showErrors: boolean
  registerSave: (save: GuidedFormSave) => () => void
  saveForms: (validate?: boolean) => Promise<boolean>
} | null>(null)

/** Flushes the current draft before navigation, including the still-focused field. */
export function useGuidedForm<T extends FieldValues>(form: UseFormReturn<T>, onSave: SubmitHandler<T>) {
  const context = useContext(GuidedFormContext)
  const registerSave = context?.registerSave
  const { handleSubmit, getValues, formState: { isDirty } } = form

  useEffect(() => registerSave?.(async (validate = true) => {
    if (!validate) {
      if (isDirty) await onSave(getValues())
      return true
    }
    let valid = false
    await handleSubmit(async (data) => {
      if (isDirty) await onSave(data)
      valid = true
    })()
    return valid
  }), [registerSave, handleSubmit, getValues, isDirty, onSave])

  return context
}
