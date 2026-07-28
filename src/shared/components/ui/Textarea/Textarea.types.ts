import type { Ref, TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
  showCharacterCount?: boolean
  ref?: Ref<HTMLTextAreaElement>
}
