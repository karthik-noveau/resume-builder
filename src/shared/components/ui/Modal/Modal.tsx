import { Modal as AntModal } from 'antd'
import type { ModalProps } from './Modal.types'
import styles from './Modal.module.css'

// xl is wide enough for four resume previews at the gallery's own scale.
const widthByMaxWidth = { sm: 384, md: 512, lg: 672, xl: 980 }

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={null}
      width={widthByMaxWidth[maxWidth]}
      className={styles.modal}
      keyboard
      mask={{ closable: true }}
      destroyOnHidden
      closable={{ 'aria-label': 'Close dialog' }}
      classNames={{ body: styles.body }}
    >
      {children}
    </AntModal>
  )
}
