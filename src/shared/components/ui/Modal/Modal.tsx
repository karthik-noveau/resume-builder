import { Modal as AntModal } from 'antd'
import { useEffect, useState } from 'react'
import { usePresence } from 'framer-motion'
import { clsx } from 'clsx'
import type { ModalProps } from './Modal.types'
import styles from './Modal.module.css'
import mobile from '@/shared/styles/mobileEditor.module.css'

// xl is wide enough for four resume previews at the gallery's own scale.
const widthByMaxWidth = {
  sm: 384,
  md: 512,
  lg: 672,
  xl: 980,
  preview: 760,
  full: 'calc(100vw - 32px)',
}

export function Modal({
  isOpen,
  onClose,
  title,
  headerActions,
  centered = false,
  children,
  className,
  maxWidth = 'md',
}: ModalProps) {
  // Lazy dialogs can render speculatively inside Suspense. Open only after
  // mounting so a discarded render cannot leave an orphaned Escape handler.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Conditional dialogs remain mounted until antd finishes its exit animation.
  const [isPresent, safeToRemove] = usePresence()
  useEffect(() => {
    if (!isPresent && !isOpen) safeToRemove?.()
  }, [isPresent, isOpen, safeToRemove])

  return (
    <AntModal
      open={mounted && isOpen && isPresent}
      afterClose={() => {
        if (!isPresent) safeToRemove?.()
      }}
      centered={centered}
      onCancel={onClose}
      title={
        headerActions ? (
          <div className={styles.headerRow} role="group" aria-label={title}>
            <span>{title}</span>
            {headerActions}
          </div>
        ) : (
          title
        )
      }
      footer={null}
      width={widthByMaxWidth[maxWidth]}
      transitionName={maxWidth === 'preview' ? 'resume-preview' : 'resume-dialog'}
      className={clsx(
        styles.modal,
        mobile.controls,
        className,
        (maxWidth === 'full' || maxWidth === 'preview') && styles.tallModal,
        maxWidth === 'preview' && styles.previewModal,
        maxWidth === 'xl' && styles.wideModal
      )}
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
