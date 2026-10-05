import { lazy, Suspense, useCallback, useState } from 'react'
import { Download } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { PreviewFrame } from './PreviewFrame'
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
  onDownload: () => void
  previewUrl: string | null
}

export function ExportModal({
  isOpen,
  onClose,
  status,
  error,
  onRetry,
  onDownload,
  previewUrl,
}: ExportModalProps) {
  const isFailed = status === 'failed'
  const [readyUrl, setReadyUrl] = useState<string | null>(null)
  const handleReadyChange = useCallback((ready: boolean) => {
    setReadyUrl(ready ? previewUrl : null)
  }, [previewUrl])
  const canDownload = status === 'completed' && previewUrl !== null && readyUrl === previewUrl

  // Keep a document-sized dialog throughout loading, rendering, and closing.
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview & export"
      maxWidth="preview"
    >
      <div className={styles.body}>
        <div className={styles.preview}>
          {isFailed ? (
            <PreviewFrame loading={false}>
              <ExportError message={error || 'An unexpected error occurred'} onRetry={onRetry} onClose={onClose} />
            </PreviewFrame>
          ) : (
            <Suspense fallback={<PreviewFrame />}>
              <PdfPreview key={previewUrl ?? 'preparing'} url={previewUrl} onRetry={onRetry}
                onReadyChange={handleReadyChange} />
            </Suspense>
          )}
        </div>
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Back to editor</Button>
          <Button onClick={onDownload} disabled={!canDownload}>
            <Download size={15} aria-hidden="true" />
            Export PDF
          </Button>
        </div>
      </div>
    </Modal>
  )
}
