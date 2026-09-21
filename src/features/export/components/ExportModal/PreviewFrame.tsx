import type { ReactNode, Ref } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import styles from './PdfPreview.module.css'

interface PreviewFrameProps {
  children?: ReactNode
  frameRef?: Ref<HTMLDivElement>
  loading?: boolean
  pageCount?: number
  zoom?: number
  onZoomOut?: () => void
  onZoomIn?: () => void
}

/** The same shell spans module loading, PDF generation and canvas painting. */
export function PreviewFrame({
  children, frameRef, loading = true, pageCount = 0, zoom = 1, onZoomOut, onZoomIn,
}: PreviewFrameProps) {
  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.count} aria-live="polite">
          {pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'PDF preview'}
        </span>
        <div className={styles.group}>
          <button type="button" className={styles.control} aria-label="Zoom out"
            disabled={loading || !onZoomOut} onClick={onZoomOut}>
            <Minus size={15} aria-hidden="true" />
          </button>
          <span className={styles.readout}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.control} aria-label="Zoom in"
            disabled={loading || !onZoomIn} onClick={onZoomIn}>
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={styles.frame} ref={frameRef} aria-busy={loading}>
        {loading && <div className={styles.loading}>
          <Spinner size={28} label="Preparing preview…" />
          <p>Preparing preview…</p>
        </div>}
        <div className={styles.content} data-ready={!loading} aria-hidden={loading}>
          {children}
        </div>
      </div>
    </div>
  )
}
