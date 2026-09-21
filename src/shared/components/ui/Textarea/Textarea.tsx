import { useId } from 'react'
import { Input as AntInput } from 'antd'
import { clsx } from 'clsx'
import type { TextareaProps } from './Textarea.types'
import styles from './Textarea.module.css'

export function Textarea({
  label,
  required,
  error,
  helperText,
  showCharacterCount,
  maxLength,
  value,
  rows = 4,
  className,
  id: externalId,
  ref: externalRef,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const id = externalId ?? generatedId
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const charCount = typeof value === 'string' ? value.length : 0

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>

      <AntInput.TextArea
        ref={externalRef as never}
        id={id}
        required={required}
        value={value}
        maxLength={maxLength}
        autoSize={{ minRows: rows }}
        status={error ? 'error' : undefined}
        aria-invalid={!!error}
        aria-describedby={clsx(error && errorId, helperText && helperId) || undefined}
        className={className}
        {...rest}
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
