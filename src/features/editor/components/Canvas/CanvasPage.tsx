import type { LayoutPage } from '@/shared/types/layout.types'
import type { SectionType } from '@/shared/types/resume.types'
import { CanvasNode } from './CanvasNode'
import { ptToPx } from './canvas.utils'

interface CanvasPageProps {
  page: LayoutPage
  pageIndex: number
  selectedSectionId: string | null
  selectedEntryId: string | null
  onSectionClick: (id: string, type: SectionType) => void
  onEntryClick: (entryId: string, type: SectionType) => void
  interactive?: boolean
}

export function CanvasPage({
  page,
  pageIndex,
  selectedSectionId,
  selectedEntryId,
  onSectionClick,
  onEntryClick,
  interactive = true,
}: CanvasPageProps) {
  return (
    <div
      aria-label={`Page ${pageIndex + 1}`}
      style={{
        position: 'relative',
        width: `${ptToPx(page.widthPt)}px`,
        height: `${ptToPx(page.heightPt)}px`,
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }}
    >
      {page.nodes.map((node) => (
        <CanvasNode
          key={node.id}
          node={node}
          selectedSectionId={selectedSectionId}
          selectedEntryId={selectedEntryId}
          onSectionClick={onSectionClick}
          onEntryClick={onEntryClick}
          interactive={interactive}
        />
      ))}
    </div>
  )
}
