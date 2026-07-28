import type { LayoutNode } from '@/shared/types/layout.types'
import type { SectionType } from '@/shared/types/resume.types'
import { SectionErrorBoundary } from '../SectionErrorBoundary'
import { CanvasLeaf } from './CanvasLeaf'
import { ptToPx } from './canvas.utils'
import { SELECTION_RING, HOVER_RING } from './canvas.constants'
import { useState } from 'react'

const LEAF_TYPES = new Set<LayoutNode['type']>([
  'text', 'bullet', 'tag', 'divider', 'link', 'image', 'rect', 'icon',
  'section-header', 'entry-header', 'entry-body',
])

interface CanvasNodeProps {
  node: LayoutNode
  selectedSectionId: string | null
  selectedEntryId: string | null
  onSectionClick: (id: string, type: SectionType) => void
  onEntryClick: (entryId: string, type: SectionType) => void
}

export function CanvasNode({
  node,
  selectedSectionId,
  selectedEntryId,
  onSectionClick,
  onEntryClick,
}: CanvasNodeProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const isSection = node.type === 'section'
  const entryRef = node.type === 'entry' && node.editRef?.kind === 'entry' ? node.editRef : undefined
  const isEntry = entryRef !== undefined
  const isInteractive = isSection || isEntry
  // Sections that contain entries (experience, education, etc.) render an
  // interactive `role="button"` CanvasNode for each entry inside them. A
  // section can't also expose button semantics itself without nesting one
  // interactive control inside another (axe: nested-interactive /
  // no-focusable-content) — so only entries get real button semantics here.
  // The section itself stays clickable for mouse users; the sidebar's
  // "Edit <section> section" control remains the keyboard-accessible route.
  const isFocusableButton = isEntry
  const isSelected = isSection
    ? node.id === selectedSectionId
    : entryRef !== undefined && entryRef.entryId === selectedEntryId

  const positionStyle = {
    position: 'absolute' as const,
    left: `${ptToPx(node.xPt)}px`,
    top: `${ptToPx(node.yPt)}px`,
    width: `${ptToPx(node.widthPt)}px`,
    height: node.heightPt > 0 ? `${ptToPx(node.heightPt)}px` : undefined,
    outline: isSelected ? SELECTION_RING : (hovered || focused) && isInteractive ? HOVER_RING : undefined,
    cursor: isInteractive ? 'pointer' : undefined,
    boxSizing: 'border-box' as const,
    zIndex: node.type === 'rect' || node.type === 'divider' ? 0 : 1,
    transform: node.rotationDeg ? `rotate(${node.rotationDeg}deg)` : undefined,
    transformOrigin: node.rotationDeg ? 'center' : undefined,
  }

  const activate = isSection && node.sectionType
    ? () => onSectionClick(node.id, node.sectionType!)
    : entryRef
      ? () => onEntryClick(entryRef.entryId, entryRef.sectionType)
      : undefined

  const handleClick = activate
    ? (e: React.MouseEvent) => {
        e.stopPropagation()
        activate()
      }
    : undefined

  const handleKeyDown = activate
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          activate()
        }
      }
    : undefined

  const ariaLabel = isSection && node.sectionType
    ? `${node.sectionType} section`
    : entryRef
      ? `${entryRef.sectionType} entry`
      : undefined

  const content = (
    <div
      style={positionStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
      onFocus={isFocusableButton ? () => setFocused(true) : undefined}
      onBlur={isFocusableButton ? () => setFocused(false) : undefined}
      tabIndex={isFocusableButton ? 0 : undefined}
      aria-pressed={isFocusableButton ? isSelected : undefined}
      aria-label={ariaLabel}
      role={isFocusableButton ? 'button' : undefined}
    >
      {LEAF_TYPES.has(node.type) ? (
        <CanvasLeaf node={node} />
      ) : (
        node.children.map((child) => (
          <CanvasNode
            key={child.id}
            node={child}
            selectedSectionId={selectedSectionId}
            selectedEntryId={selectedEntryId}
            onSectionClick={onSectionClick}
            onEntryClick={onEntryClick}
          />
        ))
      )}
    </div>
  )

  if (isSection) {
    return <SectionErrorBoundary>{content}</SectionErrorBoundary>
  }

  return content
}
