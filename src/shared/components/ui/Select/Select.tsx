import { useId } from 'react'
import { Select as AntSelect } from 'antd'
import { clsx } from 'clsx'
import type { SelectProps } from './Select.types'
import styles from './Select.module.css'

export function Select({
  label,
  hideLabel,
  icon,
  options,
  error,
  helperText,
  placeholder,
  className,
  id: externalId,
  value,
  defaultValue,
  name,
  disabled,
  onChange,
  onBlur,
}: SelectProps) {
  const generatedId = useId()
  const id = externalId ?? generatedId
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <span id={labelId} className={clsx(styles.label, hideLabel && styles.srOnly)}>
        {label}
      </span>

      <AntSelect
        id={id}
        aria-labelledby={labelId}
        prefix={icon}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        className={clsx(styles.select, className)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(newValue: string) => {
          onChange?.({ target: { name, value: newValue } })
        }}
        onBlur={onBlur}
        options={options.map((opt) => ({ value: opt.value, label: opt.label, disabled: opt.disabled }))}
      />

      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!error && helperText && <p className={styles.helper}>{helperText}</p>}
    </div>
  )
}
