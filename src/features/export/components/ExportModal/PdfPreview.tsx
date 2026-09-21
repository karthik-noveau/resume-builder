import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Button } from '@/shared/components/ui/Button/Button'
import { PreviewFrame } from './PreviewFrame'
import styles from './PdfPreview.module.css'

/**
 * The worker is bundled rather than fetched from a CDN. This product runs
 * entirely in the browser with no account and no network, and a preview that
 * silently needed cdnjs to be reachable would break exactly where it promises
 * not to. Vite rewrites this URL to a hashed asset it emits itself.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
const DEFAULT_ZOOM_INDEX = 2

/** Breathing room around the sheet inside its well. */
const GUTTER_PX = 32

interface PdfPreviewProps {
  /** Blob URL of the generated PDF. */
  url: string | null
  onRetry: () => void
}

/**
 * Renders the generated PDF in the app's own chrome.
 *
 * An <iframe> pointed at the blob handed the file to the browser's built-in
 * viewer, which arrives with its own dark toolbar, a thumbnail rail and the
 * blob's UUID as the document title — someone else's product sitting inside
 * this one, and different in every browser. pdf.js draws the pages to a canvas
 * so the surrounding UI is ours.
 */
export function PdfPreview({ url, onRetry }: PdfPreviewProps) {
  const [pageCount, setPageCount] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [failed, setFailed] = useState<string | null>(null)
  const [frame, setFrame] = useState<{ w: number; h: number }>()
  /** Page height ÷ width, read from the document rather than assumed. */
  const [aspect, setAspect] = useState<number>()
  const [ready, setReady] = useState(false)
  const renderedPages = useRef(new Set<number>())
  const pendingLoad = useRef({ sequence: 0 })
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const load = pendingLoad.current
    const measure = () => setFrame(current => {
      const w = el.clientWidth
      const h = el.clientHeight
      return current?.w === w && current.h === h ? current : { w, h }
    })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      observer.disconnect()
      load.sequence++
    }
  }, [])

  const onError = useCallback(() => {
    setFailed('The PDF preview couldn’t load. Try generating it again.')
  }, [])

  const onLoad = useCallback((pdf: PDFDocumentProxy) => {
    const load = pendingLoad.current
    const sequence = ++load.sequence
    // Establish the real page ratio before mounting any canvases. Rendering
    // once at the PDF's native size and then fitting it caused a visible jump.
    void pdf.getPage(1).then(page => {
      if (sequence !== load.sequence) return
      const viewport = page.getViewport({ scale: 1 })
      setAspect(viewport.height / viewport.width)
      setPageCount(pdf.numPages)
    }).catch(() => {
      if (sequence === load.sequence) onError()
    })
  }, [onError])

  const zoom = ZOOM_STEPS[zoomIndex]

  /**
   * Width at which a whole page is visible, so 100% means "the entire sheet"
   * rather than "as wide as the modal". Basing it on the container's width
   * alone made the default view a 2300px-tall page in a 685px frame — a
   * preview you had to scroll to see any of.
   */
  const pageWidth = frame && frame.w > GUTTER_PX && frame.h > GUTTER_PX && aspect
    ? Math.max(1, Math.min(frame.w - GUTTER_PX, (frame.h - GUTTER_PX) / aspect)) * zoom
    : undefined

  if (failed) {
    return (
      <PreviewFrame loading={false}>
        <div className={styles.centered} role="alert">
          <div className={styles.failure}>
            <p className={styles.failed}>{failed}</p>
            <Button onClick={onRetry}>Retry preview</Button>
          </div>
        </div>
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame frameRef={frameRef} loading={!ready} pageCount={pageCount} zoom={zoom}
      onZoomOut={zoomIndex > 0 ? () => setZoomIndex(i => i - 1) : undefined}
      onZoomIn={zoomIndex < ZOOM_STEPS.length - 1 ? () => setZoomIndex(i => i + 1) : undefined}>
      {url && (
        <Document
          file={url}
          // react-pdf 11 suspends and throws by default. Keep PDF loading and
          // failures local to this dialog instead of the router error boundary.
          suspense={false}
          onLoadSuccess={onLoad}
          onSourceError={onError}
          onLoadError={onError}
          loading={null}
          error={null}
          className={styles.document}
        >
          {/* Every page at once. A portrait sheet alone in a full-width dialog
              left most of the window grey, and paging through one at a time
              hid the very thing a preview is for — whether the whole document
              breaks where you expect. They wrap and scroll when there are more
              than the width can hold. */}
          {pageWidth && Array.from({ length: pageCount }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            suspense={false}
            width={pageWidth}
            onLoadError={onError}
            onRenderError={onError}
            onRenderSuccess={() => {
              renderedPages.current.add(i)
              if (renderedPages.current.size === pageCount) setReady(true)
            }}
            className={styles.page}
            loading={null}
            /* Canvas only. The text and annotation layers need pdf.js's own
               viewer stylesheet, which is 160 kB and declares .dialog,
               .primaryButton and .secondaryButton globally — three names this
               app already uses. A preview is for looking at; the real file is
               a click away and keeps its selectable text and live links. */
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
          ))}
        </Document>
      )}
    </PreviewFrame>
  )
}
