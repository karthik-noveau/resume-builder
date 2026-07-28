import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'
import type { ConfirmDialogProps } from './ConfirmDialog.types'
import styles from './ConfirmDialog.module.css'

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className={styles.body}>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
