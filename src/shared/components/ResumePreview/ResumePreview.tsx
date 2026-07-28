import { FileText } from 'lucide-react'
import type { LayoutTree } from '@/shared/types/layout.types'
import { CanvasPage } from '@/features/editor/components/Canvas/CanvasPage'
import { ptToPx } from '@/features/editor/components/Canvas/canvas.utils'
import styles from './ResumePreview.module.css'

interface ResumePreviewProps {
  layoutTree: LayoutTree | null
  widthPx: number
  aspectRatio?: number
  className?: string
}

const noop = () => {}

/**
 * Renders a non-interactive, scaled-down preview of a resume's first page,
 * reusing the same CanvasPage the live editor renders with — so previews are
 * pixel-faithful to the real template instead of a generic placeholder.
 */
export function ResumePreview({ layoutTree, widthPx, aspectRatio = 1.414, className }: ResumePreviewProps) {
  const page = layoutTree?.pages[0]
  const heightPx = widthPx * (page ? page.heightPt / page.widthPt : aspectRatio)

  return (
    <div
      className={className}
      style={{
        width: widthPx,
        height: heightPx,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'relative',
        backgroundColor: '#ffffff',
      }}
      aria-hidden="true"
      /* CanvasPage renders a <button> per section and entry — meaningful in the
         editor, but here they are scaled-down decoration. pointer-events and
         aria-hidden already neutralise mouse and AT; neither removes them from
         the tab order, so a gallery of previews put ~4 invisible tab stops per
         card in front of keyboard users. `inert` is what actually takes a
         subtree out of sequential focus navigation. */
      inert
    >
      {page ? (
        <div
          style={{
            transform: `scale(${widthPx / ptToPx(page.widthPt)})`,
            transformOrigin: 'top left',
          }}
        >
          <CanvasPage
            page={page}
            pageIndex={0}
            selectedSectionId={null}
            selectedEntryId={null}
            onSectionClick={noop}
            onEntryClick={noop}
          />
        </div>
      ) : (
        <div className={styles.fallback}>
          <FileText size={Math.max(20, widthPx * 0.25)} className={styles.fallbackIcon} />
        </div>
      )}
    </div>
  )
}
