import { useId } from 'react'
import { Input as AntInput } from 'antd'
import { clsx } from 'clsx'
import type { InputProps } from './Input.types'
import styles from './Input.module.css'

export function Input({
  label,
  error,
  helperText,
  showCharacterCount,
  maxLength,
  value,
  className,
  id: externalId,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const id = externalId ?? generatedId
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <AntInput
        id={id}
        value={value}
        maxLength={maxLength}
        status={error ? 'error' : undefined}
        aria-invalid={!!error}
        aria-describedby={clsx(error && errorId, helperText && helperId) || undefined}
        className={className}
        {...(rest as Record<string, unknown>)}
      />

      <div className={styles.footer}>
        <div className={styles.messages}>
          {error && (
            <p id={errorId} role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {!error && helperText && (
            <p id={helperId} className={styles.helper}>
              {helperText}
            </p>
          )}
        </div>
        {showCharacterCount && maxLength && (
          <p className={styles.count}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
