import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import styles from './AutosaveIndicator.module.css'

interface AutosaveIndicatorProps {
  isSaving: boolean
  isDirty: boolean
  error?: string | null
}

/** Shared save-status pill, used by both the full editor's Toolbar and the guided wizard's header. */
export function AutosaveIndicator({ isSaving, isDirty, error }: AutosaveIndicatorProps) {
  if (error) {
    return (
      <span
        className={clsx(styles.pill, styles.pillError)}
        aria-live="polite"
        title={error}
      >
        <AlertCircle size={13} aria-hidden="true" />
        Save failed
      </span>
    )
  }
  if (isSaving) {
    return (
      <span
        className={clsx(styles.pill, styles.pillNeutral)}
        aria-live="polite"
      >
        <Loader2 size={13} className={styles.spin} aria-hidden="true" />
        Saving…
      </span>
    )
  }
  if (!isDirty) {
    return (
      <span
        className={clsx(styles.pill, styles.pillNeutral)}
        aria-live="polite"
      >
        <Check size={13} className={styles.successIcon} aria-hidden="true" />
        Saved
      </span>
    )
  }
  return null
}
