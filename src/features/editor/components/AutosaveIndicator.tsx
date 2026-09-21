import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import styles from './AutosaveIndicator.module.css'
import { useResumeStore } from '@/shared/stores/resume.store'

interface AutosaveIndicatorProps {
  isSaving: boolean
  isDirty: boolean
  error?: string | null
}

/** Shared save-status pill, used by both the full editor's Toolbar and the guided wizard's header. */
export function AutosaveIndicator({ isSaving, isDirty, error }: AutosaveIndicatorProps) {
  if (error) {
    return (
      <button
        type="button"
        onClick={() => { void useResumeStore.getState().saveActiveResume() }}
        disabled={isSaving}
        aria-label="Save failed. Retry saving"
        className={clsx(styles.pill, styles.pillError)}
        aria-live="polite"
        title={error}
      >
        <AlertCircle size={13} aria-hidden="true" />
        <span>Save failed</span><span aria-hidden="true">· Retry</span>
      </button>
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
  return <span className={clsx(styles.pill, styles.pillNeutral)} role="status">Unsaved changes</span>
}
