import type { LayoutNode } from '@/shared/types/layout.types'
import type { SectionType } from '@/shared/types/resume.types'
import { SectionErrorBoundary } from '../SectionErrorBoundary'
import { CanvasLeaf } from './CanvasLeaf'
import { ptToPx } from './canvas.utils'
import {
  CANVAS_HOVER, CANVAS_SELECTED, CANVAS_STYLE_TARGET,
  CANVAS_STATE_RADIUS, CANVAS_STATE_TRANSITION,
  type CanvasStateStyle,
} from './canvas.constants'
import { useEditorStore } from '@/shared/stores/editor.store'
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
  interactive?: boolean
}

export function CanvasNode({
  node,
  selectedSectionId,
  selectedEntryId,
  onSectionClick,
  onEntryClick,
  interactive = true,
}: CanvasNodeProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const isStyleTarget = useEditorStore((s) => s.styleTarget?.key === node.styleKey)
  // While this element is open for inline editing, the editor draws the only
  // ring. Both drawing one produced two strokes at different radii with a sliver
  // of page between them — the "double border".
  const isEditingHere = useEditorStore((s) => s.editingKey != null && s.editingKey === node.styleKey)
  // Panels, bands and rules the template paints behind the words. They are
  // selectable and stylable like anything else, but they must never rise above
  // the content sitting on them.
  const isDecoration = node.type === 'rect' || node.type === 'divider'
  const isSection = node.type === 'section'
  const entryRef = node.type === 'entry' && node.editRef?.kind === 'entry' ? node.editRef : undefined
  const isEntry = entryRef !== undefined
  const isInteractive = interactive && (isSection || isEntry)
  // Editable text leaves are the keyboard targets inside the resume. Keeping
  // their entry/section containers mouse-selectable but out of the tab order
  // prevents nested interactive controls. The properties sidebar remains the
  // keyboard-accessible route for selecting and managing whole entries.
  const isSelected = isSection
    ? node.id === selectedSectionId
    : entryRef !== undefined && entryRef.entryId === selectedEntryId

  // One state at a time, strongest first: the element the inspector points at
  // outranks the block it sits in, which outranks a passing cursor.
  const state: CanvasStateStyle | undefined = isEditingHere
    ? undefined
    : isStyleTarget
    ? CANVAS_STYLE_TARGET
    : isSelected
      ? CANVAS_SELECTED
      : (hovered || focused) && isInteractive
        ? CANVAS_HOVER
        : undefined

  const positionStyle = {
    position: 'absolute' as const,
    left: `${ptToPx(node.xPt)}px`,
    top: `${ptToPx(node.yPt)}px`,
    width: `${ptToPx(node.widthPt)}px`,
    height: node.heightPt > 0 ? `${ptToPx(node.heightPt)}px` : undefined,
    outline: state?.outline,
    outlineOffset: state?.outlineOffset,
    backgroundColor: state?.background,
    boxShadow: state?.shadow,
    // Only while a state is showing: a radius on every node would round the
    // page's own decorative rects and bands.
    borderRadius: state ? CANVAS_STATE_RADIUS : undefined,
    // Selecting is the only thing a press does on the canvas now; reordering
    // lives in the sidebar's structure tree.
    cursor: node.styleKey && isInteractive ? 'pointer' : undefined,
    boxSizing: 'border-box' as const,
    overflow: 'visible' as const,
    transition: isInteractive || isStyleTarget ? CANVAS_STATE_TRANSITION : undefined,
    // Lifted while active so its halo is not clipped by a later sibling —
    // except for decoration, which stays below the content whatever its state.
    // Promoting it was how clicking the sidebar panel made the whole sidebar
    // look empty: an opaque full-height rect jumped from 0 to 2 and painted
    // over every word on top of it. Its outline is drawn outside its box, so
    // the selection is still legible from down here.
    zIndex: isDecoration ? 0 : state ? 2 : 1,
    transform: node.rotationDeg ? `rotate(${node.rotationDeg}deg)` : undefined,
  }

  // Profile fields live outside section/entry containers, so their clicks
  // have no enclosing section to open the inspector. Handle them here while
  // retaining capture-phase style selection and the leaf's inline editing.
  const isPersonalInfo = node.editRef?.kind === 'personal-info'
    || (node.editRef?.kind === 'section-title' && node.editRef.sectionType === 'contact')
    || node.panelTarget === 'personal-info'

  const activate = interactive && isPersonalInfo
    ? () => useEditorStore.getState().openPersonalInfo(
        node.editRef?.kind === 'personal-info' ? node.editRef.field
          : node.editRef?.kind === 'section-title' ? 'contactTitle'
          : node.panelField
      )
    : interactive && isSection && node.sectionType
      ? () => onSectionClick(node.id, node.sectionType!)
      : interactive && entryRef
        ? () => onEntryClick(entryRef.entryId, entryRef.sectionType)
        : undefined

  const handleClick = activate
    ? (e: React.MouseEvent) => {
        e.stopPropagation()
        activate()
      }
    : undefined

  /**
   * Claims this node as the style inspector's target.
   *
   * Runs in the capture phase, which is what makes "click anything to style it"
   * work at all here: capture runs outside-in, so the deepest node under the
   * pointer writes last and wins, and it is unaffected by the
   * `stopPropagation` that editable leaves and section containers use in the
   * bubble phase to keep their own click handling from colliding.
   */
  const handleStyleClickCapture = interactive && node.styleKey
    ? () => {
        useEditorStore.getState().selectStyleTarget({
          key: node.styleKey!,
          role: node.styleRole ?? null,
          label: node.styleLabel ?? 'Element',
        })
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
      data-style-key={node.styleKey}
      onClick={handleClick}
      onClickCapture={handleStyleClickCapture}
      onKeyDown={handleKeyDown}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={ariaLabel}
    >
      {LEAF_TYPES.has(node.type) ? (
        <CanvasLeaf node={node} interactive={interactive} />
      ) : (
        node.children.map((child) => (
          <CanvasNode
            key={child.id}
            node={child}
            selectedSectionId={selectedSectionId}
            selectedEntryId={selectedEntryId}
            onSectionClick={onSectionClick}
            onEntryClick={onEntryClick}
            interactive={interactive}
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
