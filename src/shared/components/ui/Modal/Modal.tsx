import { Modal as AntModal } from 'antd'
import { clsx } from 'clsx'
import type { ModalProps } from './Modal.types'
import styles from './Modal.module.css'
import mobile from '@/shared/styles/mobileEditor.module.css'

// xl is wide enough for four resume previews at the gallery's own scale.
const widthByMaxWidth = { sm: 384, md: 512, lg: 672, xl: 980, preview: 760, full: 'calc(100vw - 32px)' }

export function Modal({ isOpen, onClose, title, children, className, maxWidth = 'md' }: ModalProps) {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      title={title}
      footer={null}
      width={widthByMaxWidth[maxWidth]}
      transitionName={maxWidth === 'preview' ? 'resume-preview' : undefined}
      className={clsx(styles.modal, mobile.controls, className,
        (maxWidth === 'full' || maxWidth === 'preview') && styles.tallModal,
        maxWidth === 'preview' && styles.previewModal,
        maxWidth === 'xl' && styles.wideModal)}
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
