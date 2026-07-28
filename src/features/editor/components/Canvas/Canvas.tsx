import { useEffect, useRef, useState } from 'react'
import type { LayoutTree } from '@/shared/types/layout.types'
import type { SectionType } from '@/shared/types/resume.types'
import { CanvasPage } from './CanvasPage'
import { PageIndicator } from './PageIndicator'
import { CANVAS_PAGE_GAP_PX, PAGE_DIMENSIONS_PX } from './canvas.constants'
import { Skeleton } from '@/shared/components/ui/Skeleton/Skeleton'
import { EditorErrorBoundary } from '../EditorErrorBoundary'
import { useEditorStore } from '@/shared/stores/editor.store'
import styles from './Canvas.module.css'

interface CanvasProps {
  layoutTree: LayoutTree | null
  zoomLevel: number
  pageSize: 'A4' | 'LETTER'
  selectedSectionId: string | null
  selectedEntryId: string | null
  onSectionClick: (id: string, type: SectionType) => void
  onEntryClick: (entryId: string, type: SectionType) => void
  onCanvasClick: () => void
}

function CanvasPlaceholder({ pageSize }: { pageSize: 'A4' | 'LETTER' }) {
  const { width, height } = PAGE_DIMENSIONS_PX[pageSize]
  return (
    <div
      className={styles.placeholder}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
      aria-label="Resume canvas — loading template"
      aria-busy="true"
    >
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" height={16} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <Skeleton variant="rect" width="100%" height={12} />
        <Skeleton variant="rect" width="90%" height={12} />
        <Skeleton variant="rect" width="80%" height={12} />
      </div>
      <div style={{ marginTop: '16px' }}><Skeleton variant="text" width="30%" height={20} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton variant="rect" width="100%" height={12} />
        <Skeleton variant="rect" width="95%" height={12} />
        <Skeleton variant="rect" width="85%" height={12} />
      </div>
    </div>
  )
}

export function Canvas({
  layoutTree,
  zoomLevel,
  pageSize,
  selectedSectionId,
  selectedEntryId,
  onSectionClick,
  onEntryClick,
  onCanvasClick,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const activePage = useEditorStore((s) => s.activePage)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const pageCount = layoutTree?.pages.length ?? 0

  /**
   * Shrink-to-fit factor for viewports narrower than a page. An A4 page is
   * ~794px wide, so at phone widths it would be clipped on both edges with no
   * way to recover — the zoom controls are hidden below 768px. This only ever
   * scales *down* (capped at 1), so desktop rendering is untouched and the
   * user's own zoomLevel still multiplies on top of it.
   */
  const [fitScale, setFitScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const pageWidth = PAGE_DIMENSIONS_PX[pageSize].width
    const measure = () => {
      // 16px of breathing room so the page doesn't sit flush to the edges.
      const available = container.clientWidth - 16
      setFitScale(available > 0 ? Math.min(1, available / pageWidth) : 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [pageSize])

  const scale = zoomLevel * fitScale

  /** Untransformed size of the page stack, used to size the wrapper above. */
  const contentRef = useRef<HTMLDivElement>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    // offsetWidth/Height report the pre-transform layout box, which is exactly
    // what we need to multiply by `scale`.
    const measure = () => { setNaturalSize({ w: el.offsetWidth, h: el.offsetHeight }) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [layoutTree, pageSize])

  // Track which page is most visible in the scrollable viewport, so the
  // page indicator (and future page-aware features) reflect actual scroll position.
  useEffect(() => {
    const container = containerRef.current
    if (!container || pageCount === 0) return

    const visibleRatios = new Map<number, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.pageIndex)
          visibleRatios.set(idx, entry.intersectionRatio)
        }
        let bestIndex = 0
        let bestRatio = -1
        for (const [idx, ratio] of visibleRatios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestIndex = idx
          }
        }
        setActivePage(bestIndex)
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    for (const el of pageRefs.current) {
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [pageCount, setActivePage])

  const scrollToPage = (index: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, index))
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={styles.viewport}>
      <div
        ref={containerRef}
        className={styles.scrollArea}
        onClick={onCanvasClick}
        aria-label="Resume canvas"
        tabIndex={0}
      >
        {/* Outer box carries the *scaled* dimensions. transform: scale() paints
            smaller but leaves the layout box at full size, which otherwise
            leaves the scroll area ~200px wider than the viewport on a phone
            (and, when zooming in, makes the enlarged part unreachable). */}
        <div
          style={{
            width: naturalSize.w ? naturalSize.w * scale : undefined,
            height: naturalSize.h ? naturalSize.h * scale : undefined,
            flexShrink: 0,
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              display: 'flex',
              flexDirection: 'column',
              gap: `${CANVAS_PAGE_GAP_PX}px`,
              width: 'max-content',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <EditorErrorBoundary>
            {layoutTree ? (
              layoutTree.pages.map((page, i) => (
                <div
                  key={i}
                  ref={(el) => { pageRefs.current[i] = el }}
                  data-page-index={i}
                  style={{ flexShrink: 0 }}
                >
                  <CanvasPage
                    page={page}
                    pageIndex={i}
                    selectedSectionId={selectedSectionId}
                    selectedEntryId={selectedEntryId}
                    onSectionClick={onSectionClick}
                    onEntryClick={onEntryClick}
                  />
                </div>
              ))
            ) : (
              <CanvasPlaceholder pageSize={pageSize} />
            )}
            </EditorErrorBoundary>
          </div>
        </div>
      </div>

      {pageCount > 1 && (
        <PageIndicator
          currentPage={activePage}
          totalPages={pageCount}
          onPrevPage={() => scrollToPage(activePage - 1)}
          onNextPage={() => scrollToPage(activePage + 1)}
        />
      )}
    </div>
  )
}
