import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/shared/components/ui/Input/Input'
import { Textarea } from '@/shared/components/ui/Textarea/Textarea'
import { Checkbox } from '@/shared/components/ui/Checkbox/Checkbox'
import type { InputProps } from '@/shared/components/ui/Input/Input.types'
import type { TextareaProps } from '@/shared/components/ui/Textarea/Textarea.types'
import type { CheckboxProps } from '@/shared/components/ui/Checkbox/Checkbox.types'

/** antd's Input/Textarea/Checkbox each own their internal (uncontrolled) value state, which does
 * not react to react-hook-form's `register()` — register() relies on imperatively mutating a DOM
 * node's value/checked via ref (for both initial defaultValues and later `reset()` calls), and
 * antd's internal state silently overrides that on the next render. Every field bound to one of
 * these three components must go through `Controller` (explicit value/checked + onChange) instead,
 * which antd's controlled mode fully supports. Plain native elements (StringListField's raw
 * <input>/<textarea>) aren't affected and can keep using register() normally. */

interface ControlledFieldBaseProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  onSaved: () => void
}

type ControlledInputProps<T extends FieldValues> = ControlledFieldBaseProps<T> &
  Omit<InputProps, 'name' | 'value' | 'onChange' | 'onBlur'> & {
    /** Store the field's value as a number (mirrors register()'s `valueAsNumber` option). */
    valueAsNumber?: boolean
  }

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  onSaved,
  valueAsNumber,
  ...inputProps
}: ControlledInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...inputProps}
          name={field.name}
          value={field.value ?? ''}
          onChange={(e) => {
            field.onChange(valueAsNumber ? e.target.valueAsNumber : e.target.value)
          }}
          onBlur={() => {
            field.onBlur()
            onSaved()
          }}
        />
      )}
    />
  )
}

type ControlledTextareaProps<T extends FieldValues> = ControlledFieldBaseProps<T> &
  Omit<TextareaProps, 'name' | 'value' | 'onChange' | 'onBlur'>

export function ControlledTextarea<T extends FieldValues>({
  control,
  name,
  onSaved,
  ...textareaProps
}: ControlledTextareaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Textarea
          {...textareaProps}
          name={field.name}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={() => {
            field.onBlur()
            onSaved()
          }}
        />
      )}
    />
  )
}

type ControlledCheckboxProps<T extends FieldValues> = ControlledFieldBaseProps<T> &
  Omit<CheckboxProps, 'name' | 'checked' | 'onChange' | 'onBlur'>

export function ControlledCheckbox<T extends FieldValues>({
  control,
  name,
  onSaved,
  ...checkboxProps
}: ControlledCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          {...checkboxProps}
          name={field.name}
          checked={!!field.value}
          onChange={(e) => {
            field.onChange(e.target.checked)
            onSaved()
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
