import { Modal } from '@/shared/components/ui/Modal/Modal'
import { ExportProgress } from './ExportProgress'
import { ExportError } from './ExportError'
import type { ExportStatus } from '@/shared/types/export.types'
import styles from './ExportModal.module.css'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  status: ExportStatus
  error: string | null
  onRetry: () => void
}

export function ExportModal({
  isOpen,
  onClose,
  status,
  error,
  onRetry,
}: ExportModalProps) {
  const isFailed = status === 'failed'
  const isCompleted = status === 'completed'
  const isExporting = status !== 'idle' && !isFailed && !isCompleted

  return (
    <Modal
      isOpen={isOpen}
      onClose={isExporting ? () => {} : onClose} // Block closing while exporting
      title={isFailed ? 'Error' : 'Exporting PDF'}
    >
      <div className={styles.body}>
        {isExporting || isCompleted ? (
          <ExportProgress status={status} />
        ) : isFailed ? (
          <ExportError
            message={error || 'An unexpected error occurred'}
            onRetry={onRetry}
            onClose={onClose}
          />
        ) : null}
      </div>
    </Modal>
  )
}
