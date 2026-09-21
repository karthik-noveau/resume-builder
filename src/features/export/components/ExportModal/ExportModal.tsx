import { lazy, Suspense } from 'react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { ExportProgress } from './ExportProgress'
import { ExportError } from './ExportError'
import type { ExportStatus } from '@/shared/types/export.types'
import styles from './ExportModal.module.css'

/**
 * pdf.js is around half a megabyte and only ever runs here. Splitting it out
 * keeps it off the editor's first load, the same way the generator itself is
 * loaded on demand — see export.service.ts.
 */
const PdfPreview = lazy(() => import('./PdfPreview').then((m) => ({ default: m.PdfPreview })))

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  status: ExportStatus
  error: string | null
  onRetry: () => void
  mode: 'download' | 'preview'
  previewUrl: string | null
}

export function ExportModal({
  isOpen,
  onClose,
  status,
  error,
  onRetry,
  mode,
  previewUrl,
}: ExportModalProps) {
  const isFailed = status === 'failed'
  const isCompleted = status === 'completed'
  const isExporting = status !== 'idle' && !isFailed && !isCompleted

  // Full-bleed for the preview: 'full' is calc(100vw - 32px) and .fullModal
  // pins it 16px from the top, so the dialog fills the window and the page is
  // drawn as large as that height allows.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFailed
          ? 'Couldn’t prepare your PDF'
          : mode === 'preview'
            ? 'PDF Preview'
            : isCompleted
              ? 'PDF ready'
              : 'Preparing your PDF'
      }
      maxWidth={previewUrl ? 'full' : 'md'}
    >
      <div className={styles.body}>
        {mode === 'preview' && isCompleted && previewUrl ? (
          <div className={styles.preview}>
            <Suspense
              fallback={
                <div className={styles.previewLoading}>
                  <Spinner />
                </div>
              }
            >
              <PdfPreview url={previewUrl} />
            </Suspense>
          </div>
        ) : isExporting || isCompleted ? (
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
