import { useId } from 'react'
import { Checkbox as AntCheckbox } from 'antd'
import type { CheckboxProps } from './Checkbox.types'
import styles from './Checkbox.module.css'

export function Checkbox({ label, error, className, id: externalId, ...rest }: CheckboxProps) {
  const generatedId = useId()
  const id = externalId ?? generatedId
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <AntCheckbox
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...(rest as Record<string, unknown>)}
      >
        {label}
      </AntCheckbox>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
