import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Minus, Plus } from 'lucide-react'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
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
  url: string
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
export function PdfPreview({ url }: PdfPreviewProps) {
  const [pageCount, setPageCount] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [failed, setFailed] = useState<string | null>(null)
  const [frame, setFrame] = useState<{ w: number; h: number }>()
  /** Page height ÷ width, read from the document rather than assumed. */
  const [aspect, setAspect] = useState<number>()
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setPageCount(numPages)
  }, [])

  const zoom = ZOOM_STEPS[zoomIndex]

  /**
   * Width at which a whole page is visible, so 100% means "the entire sheet"
   * rather than "as wide as the modal". Basing it on the container's width
   * alone made the default view a 2300px-tall page in a 685px frame — a
   * preview you had to scroll to see any of.
   */
  const pageWidth = frame && aspect
    ? Math.min(frame.w - GUTTER_PX, (frame.h - GUTTER_PX) / aspect) * zoom
    : undefined

  if (failed) {
    return <p className={styles.failed}>{failed}</p>
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.count} aria-live="polite">
          {pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : ' '}
        </span>

        <div className={styles.group}>
          <button
            type="button"
            className={styles.control}
            aria-label="Zoom out"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <span className={styles.readout}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className={styles.control}
            aria-label="Zoom in"
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.frame} ref={frameRef}>
        <Document
          file={url}
          onLoadSuccess={onLoad}
          onLoadError={(e) => setFailed(e.message || 'Could not open the generated PDF.')}
          loading={<div className={styles.centered}><Spinner /></div>}
          error={<p className={styles.failed}>Could not open the generated PDF.</p>}
          className={styles.document}
        >
          {/* Every page at once. A portrait sheet alone in a full-width dialog
              left most of the window grey, and paging through one at a time
              hid the very thing a preview is for — whether the whole document
              breaks where you expect. They wrap and scroll when there are more
              than the width can hold. */}
          {Array.from({ length: pageCount }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={pageWidth}
            onLoadSuccess={(loaded) => {
              // Guarded: this fires on every render of the page, and setting
              // state unconditionally would spin.
              const next = loaded.height / loaded.width
              setAspect((current) => (current === next ? current : next))
            }}
            className={styles.page}
            loading={<div className={styles.centered}><Spinner /></div>}
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
      </div>
    </div>
  )
}
