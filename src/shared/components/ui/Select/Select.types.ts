import type { FocusEvent, ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/** Native-`<select>`-shaped change event, synthesized from antd Select's `(value)` callback
 * so call sites written against the old native element (`e.target.value`) don't need to change. */
export interface SelectChangeEvent {
  target: { name?: string; value: string }
}

export interface SelectProps {
  label: string
  /** Keep the label for accessibility but visually hide it, e.g. for compact toolbar filters. */
  hideLabel?: boolean
  /** Leading icon rendered inside the control, aligned like the label-less search inputs it sits beside. */
  icon?: ReactNode
  options: SelectOption[]
  error?: string
  helperText?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  name?: string
  id?: string
  disabled?: boolean
  className?: string
  onChange?: (event: SelectChangeEvent) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
}
