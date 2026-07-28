import { AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from './ExportError.module.css'

interface ExportErrorProps {
  message: string
  onRetry: () => void
  onClose: () => void
}

export function ExportError({ message, onRetry, onClose }: ExportErrorProps) {
  return (
    <div className={styles.root}>
      <div className={styles.iconWrap}>
        <AlertCircle className={styles.icon} />
      </div>

      <div className={styles.textGroup}>
        <h3 className={styles.title}>Export Failed</h3>
        <p className={styles.message}>
          {message}
        </p>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.actionButton} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" className={styles.actionButton} onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  )
}
