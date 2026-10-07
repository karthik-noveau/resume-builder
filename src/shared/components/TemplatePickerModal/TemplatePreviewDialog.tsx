import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, Minus, Plus } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { ptToPx } from '@/features/editor/components/Canvas/canvas.utils'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import type { TemplateDefinition } from '@/shared/types/template.types'
import styles from './TemplatePreviewDialog.module.css'

type ZoomMode = 'width' | 'custom'

export function TemplatePreviewDialog({
  template,
  onClose,
  onSelect,
  pending = false,
  current = false,
  error,
}: {
  template: TemplateDefinition
  onClose: () => void
  onSelect: () => void
  pending?: boolean
  current?: boolean
  error?: string | null
}) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(640)
  const [zoomMode, setZoomMode] = useState<ZoomMode>('width')
  const [customScale, setCustomScale] = useState(1)
  const [page, setPage] = useState(0)
  const tree = getTemplatePreviewTree(template.id)
  const currentPage = tree?.pages[page]
  const naturalWidth = currentPage ? ptToPx(currentPage.widthPt) : 794
  const fitWidth = Math.min(naturalWidth, viewportWidth)
  const width = Math.max(160, zoomMode === 'custom' ? naturalWidth * customScale : fitWidth)
  const scale = width / naturalWidth

  function zoomBy(amount: number) {
    setCustomScale(Math.min(1.5, Math.max(0.25, scale + amount)))
    setZoomMode('custom')
  }

  // Modal children mount after the first effect; observe the mounted node so
  // the initial fit and subsequent viewport resizes both use the actual space.
  useEffect(() => {
    if (!viewport) return
    const observer = new ResizeObserver(([entry]) => {
      setViewportWidth(entry.contentRect.width)
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [viewport])

  useEffect(() => {
    if (viewport) {
      viewport.scrollTop = 0
      viewport.scrollLeft = 0
    }
  }, [page, viewport])

  const controls = (
    <div className={styles.controls}>
      {tree && tree.pages.length > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="ghost"
            className={styles.iconButton}
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <span>
            Page {page + 1} of {tree.pages.length}
          </span>
          <Button
            variant="ghost"
            className={styles.iconButton}
            aria-label="Next page"
            disabled={page === tree.pages.length - 1}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
      <div className={styles.zoomControls}>
        <Button
          variant="secondary"
          className={styles.fitButton}
          aria-pressed={zoomMode === 'width'}
          onClick={() => setZoomMode('width')}
        >
          <Maximize2 size={15} aria-hidden="true" />
          Fit width
        </Button>
        <div className={styles.zoomButtons} role="group" aria-label="Preview zoom">
          <Button
            variant="ghost"
            className={styles.zoomButton}
            aria-label="Zoom out"
            disabled={scale <= 0.25}
            onClick={() => zoomBy(-0.1)}
          >
            <Minus size={16} aria-hidden="true" />
          </Button>
          <span className={styles.zoomValue} aria-label="Zoom level" aria-live="polite" aria-atomic="true">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            className={styles.zoomButton}
            aria-label="Zoom in"
            disabled={scale >= 1.5}
            onClick={() => zoomBy(0.1)}
          >
            <Plus size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen
      centered
      title={`${template.name} preview`}
      headerActions={controls}
      onClose={onClose}
      maxWidth="xl"
      className={styles.dialog}
    >
      <div className={styles.root}>
        <div className={styles.details}>
          <p className={styles.description}>{template.description}</p>
          <p className={styles.meta}>
            <span>{template.designStyle}</span>
            <span>{template.layout === 'single-column' ? 'One column' : 'Two columns'}</span>
            <span>Example content</span>
          </p>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div
          className={styles.paper}
          ref={setViewport}
          tabIndex={0}
          aria-label="Template preview, scroll to inspect"
        >
          <ResumePreview
            layoutTree={tree && currentPage ? { ...tree, pages: [currentPage] } : null}
            widthPx={width}
          />
        </div>
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <Button variant="secondary" onClick={onClose}>
              Keep browsing
            </Button>
            <Button
              onClick={onSelect}
              disabled={current || pending}
              loading={pending}
              aria-label={`Use ${template.name} template`}
            >
              {current ? 'Current template' : 'Use template'}
              {!current && <ArrowRight size={15} aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
