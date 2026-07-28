import { useRef, useState, type CSSProperties } from 'react'
import { ICON_PATHS, ICON_VIEWBOX_PX } from '@/features/templates/engine/icons'
import type { LayoutNode, EditRef, IconName } from '@/shared/types/layout.types'
import { layoutStylesToCSS } from './canvas.utils'
import { useResolvedImageUrl } from './useResolvedImageUrl'
import { useResumeStore } from '@/shared/stores/resume.store'
import { getEditRefValue, applyEditRefValue } from '../../utils/editRefResolver'

interface CanvasLeafProps {
  node: LayoutNode
}

export function CanvasLeaf({ node }: CanvasLeafProps) {
  const css = layoutStylesToCSS(node.styles)

  switch (node.type) {
    case 'text':
    case 'section-header':
    case 'entry-header':
    case 'entry-body':
      if (node.editRef) {
        return <EditableLeaf editRef={node.editRef} displayContent={node.content ?? ''} css={css} />
      }
      return (
        <div style={{ ...css, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {node.content ?? ''}
        </div>
      )

    case 'bullet':
      return (
        <div style={{ display: 'flex', gap: '8px', ...css, width: '100%' }}>
          <span aria-hidden="true" style={{ flexShrink: 0 }}>•</span>
          <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{node.content ?? ''}</span>
        </div>
      )

    case 'tag':
      return (
        <span
          style={{
            ...css,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '4px',
            border: `1px solid ${node.styles.color}`,
            padding: '1px 6px',
          }}
        >
          {node.content ?? ''}
        </span>
      )

    case 'divider':
      return (
        <div
          style={{
            backgroundColor: node.styles.color,
            width: '100%',
            height: '100%',
          }}
          aria-hidden="true"
        />
      )

    case 'rect':
      return (
        <div
          style={{
            backgroundColor: node.styles.backgroundColor ?? node.styles.color,
            width: '100%',
            height: '100%',
            borderRadius: node.clipShape === 'circle' ? '50%' : undefined,
          }}
          aria-hidden="true"
        />
      )

    case 'link':
      return (
        <a href={node.href} target="_blank" rel="noopener noreferrer" style={{ ...css, display: 'inline-block', width: '100%' }}>
          {node.content ?? node.href}
        </a>
      )

    case 'image':
      return <ImageLeaf imageId={node.imageId} clipShape={node.clipShape} />

    case 'icon':
      if (!node.iconName) return null
      return node.iconEditable ? (
        <EditableIcon name={node.iconName} color={node.styles.color} />
      ) : (
        <svg
          viewBox={`0 0 ${ICON_VIEWBOX_PX} ${ICON_VIEWBOX_PX}`}
          style={{ width: '100%', height: '100%' }}
          fill="none"
          stroke={node.styles.color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={ICON_PATHS[node.iconName]} />
        </svg>
      )

    default:
      return null
  }
}

/**
 * A section-header icon the user may change. Clicking it selects the enclosing
 * section — the click bubbles to the section node — which opens that section's
 * properties, where the icon picker lives. This adds the affordance that was
 * missing: without it there was nothing to suggest the icon was editable at
 * all, so the picker was only ever found by accident.
 */
function EditableIcon({ name, color }: { name: IconName; color: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to change this section's icon"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        borderRadius: '3px',
        outline: hovered ? '2px solid rgb(var(--color-primary) / 0.5)' : undefined,
        outlineOffset: '2px',
        transition: 'outline-color 120ms',
      }}
    >
      <svg
        viewBox={`0 0 ${ICON_VIEWBOX_PX} ${ICON_VIEWBOX_PX}`}
        style={{ width: '100%', height: '100%' }}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={ICON_PATHS[name]} />
      </svg>
    </span>
  )
}

function isMultilineField(editRef: EditRef): boolean {
  return editRef.kind === 'summary' || (editRef.kind === 'entry-field' && editRef.field === 'description')
}

function describeEditRef(editRef: EditRef): string {
  switch (editRef.kind) {
    case 'personal-info': return editRef.field
    case 'summary': return 'summary'
    case 'entry-field': return editRef.field
    case 'entry-list-item': return `${editRef.field} item`
    case 'entry': return 'entry'
  }
}

/**
 * Click-to-edit text leaf. Editing is seeded from the live Resume value
 * (via getEditRefValue), never from the rendered `displayContent` — some
 * templates apply a display-only transform (e.g. uppercasing the name) or
 * fall back to placeholder text when a field is empty, and committing either
 * of those verbatim would silently corrupt the underlying data.
 */
function EditableLeaf({ editRef, displayContent, css }: { editRef: EditRef; displayContent: string; css: CSSProperties }) {
  const [editingSeed, setEditingSeed] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const revertedRef = useRef(false)
  const isEditing = editingSeed !== null
  const multiline = isMultilineField(editRef)

  const startEditing = () => {
    const resume = useResumeStore.getState().activeResume
    if (!resume) return
    setEditingSeed(getEditRefValue(editRef, resume))
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (revertedRef.current) {
      revertedRef.current = false
      setEditingSeed(null)
      return
    }
    const resume = useResumeStore.getState().activeResume
    if (resume) {
      applyEditRefValue(editRef, e.currentTarget.textContent ?? '', resume)
    }
    setEditingSeed(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      revertedRef.current = true
      setEditingSeed(null)
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const focusAtEnd = (el: HTMLDivElement | null) => {
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  if (isEditing) {
    return (
      <div
        ref={focusAtEnd}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Edit ${describeEditRef(editRef)}`}
        style={{
          ...css,
          width: '100%',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          outline: '2px solid rgb(var(--color-primary))',
          outlineOffset: '2px',
          borderRadius: '2px',
          cursor: 'text',
        }}
      >
        {editingSeed}
      </div>
    )
  }

  return (
    <div
      onDoubleClick={(e) => { e.stopPropagation(); startEditing() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Double-click to edit"
      style={{
        ...css,
        width: '100%',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        cursor: 'text',
        backgroundColor: hovered ? 'rgb(var(--color-primary) / 0.06)' : undefined,
        borderRadius: '2px',
      }}
    >
      {displayContent}
    </div>
  )
}

function ImageLeaf({ imageId, clipShape }: { imageId: string | undefined; clipShape: 'circle' | undefined }) {
  const url = useResolvedImageUrl(imageId)
  if (!url) return null

  return (
    <img
      src={url}
      alt="Profile"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: clipShape === 'circle' ? '50%' : undefined,
      }}
    />
  )
}
