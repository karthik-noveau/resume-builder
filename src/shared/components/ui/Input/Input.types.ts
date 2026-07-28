import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  /** Show character count. Requires maxLength to be set. */
  showCharacterCount?: boolean
}
