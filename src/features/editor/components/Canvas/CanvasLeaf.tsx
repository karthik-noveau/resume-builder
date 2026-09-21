import { safeLink } from '@/shared/utils/safeLink'
import { useRef, useState, type CSSProperties } from 'react'
import { ICON_PATHS, ICON_VIEWBOX_PX } from '@/features/templates/engine/icons'
import type { LayoutNode, EditRef, IconName, PersonalInfoPanelField } from '@/shared/types/layout.types'
import { layoutStylesToCSS } from './canvas.utils'
import { useResolvedImageUrl } from './useResolvedImageUrl'
import { clipShapeRadius } from '@/shared/utils/clipShape'
import type { ClipShape } from '@/shared/types/layout.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { getEditRefValue, applyEditRefValue } from '../../utils/editRefResolver'
import styles from './Canvas.module.css'

interface CanvasLeafProps {
  node: LayoutNode
  interactive?: boolean
}

export function CanvasLeaf({ node, interactive = true }: CanvasLeafProps) {
  const css = layoutStylesToCSS(node.styles)

  switch (node.type) {
    case 'text':
    case 'section-header':
    case 'entry-header':
    case 'entry-body':
      if (!interactive) {
        return (
          <div style={{ ...css, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {node.content ?? ''}
          </div>
        )
      }
      if (node.editRef) {
        return (
          <EditableLeaf
            editRef={node.editRef}
            displayContent={node.content ?? ''}
            css={css}
            styleKey={node.styleKey}
          />
        )
      }
      if (node.panelTarget === 'personal-info') {
        return <PanelLinkedLeaf displayContent={node.content ?? ''} css={css} field={node.panelField} />
      }
      return (
        <div style={{ ...css, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {node.content ?? ''}
        </div>
      )

    case 'bullet':
      return (
        <div style={{ display: 'flex', gap: '8px', ...css, width: '100%' }}>
          <span aria-hidden="true" style={{ flexShrink: 0 }}>
            •
          </span>
          <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {node.content ?? ''}
          </span>
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
            borderRadius: clipShapeRadius(node.clipShape, node.widthPt, node.heightPt),
          }}
          aria-hidden="true"
        />
      )

    case 'link':
      if (!interactive) {
        return (
          <span style={{ ...css, display: 'inline-block', width: '100%' }}>
            {node.content ?? node.href}
          </span>
        )
      }
      return (
        <a
          href={safeLink(node.href)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...css, display: 'inline-block', width: '100%' }}
        >
          {node.content ?? node.href}
        </a>
      )

    case 'image':
      return (
        <ImageLeaf
          imageId={node.imageId}
          clipShape={node.clipShape}
          widthPt={node.widthPt}
          heightPt={node.heightPt}
          interactive={interactive}
        />
      )

    case 'icon':
      if (!node.iconName) return null
      if (!interactive) return <IconGlyph name={node.iconName} color={node.styles.color} />
      if (node.panelTarget === 'personal-info') {
        return <PanelLinkedIcon name={node.iconName} color={node.styles.color} field={node.panelField} />
      }
      return node.iconEditable ? (
        <EditableIcon name={node.iconName} color={node.styles.color} />
      ) : (
        <IconGlyph name={node.iconName} color={node.styles.color} />
      )

    default:
      return null
  }
}

function IconGlyph({ name, color }: { name: IconName; color: string }) {
  return (
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
  )
}

function openPersonalInfo(e: React.MouseEvent | React.KeyboardEvent, field?: PersonalInfoPanelField) {
  e.stopPropagation()
  useEditorStore.getState().openPersonalInfo(field)
}

/** Keep direct canvas editing and the inspector in sync. Editable leaves stop
 * their click before it reaches the enclosing section, so they must explicitly
 * select the matching inspector destination. */
function openEditRefInPanel(editRef: EditRef) {
  const editor = useEditorStore.getState()
  switch (editRef.kind) {
    case 'personal-info':
      editor.openPersonalInfo()
      break
    case 'summary':
      editor.selectSection('summary', 'summary')
      break
    case 'section-title':
      if (editRef.sectionType === 'contact') editor.openPersonalInfo()
      else editor.selectSection(editRef.sectionType, editRef.sectionType)
      break
    case 'custom-section-title':
      editor.selectSection(editRef.sectionId, 'custom')
      break
    case 'entry':
    case 'entry-field':
    case 'entry-list-item':
      editor.selectEntry(editRef.entryId, editRef.sectionType)
      break
  }
}

function PanelLinkedLeaf({ displayContent, css, field }: { displayContent: string; css: CSSProperties; field?: PersonalInfoPanelField }) {
  return (
    <button
      type="button"
      onClick={(e) => openPersonalInfo(e, field)}
      aria-label={`Open ${displayContent} in Personal Info`}
      title="Open in Personal Info"
      className={styles.panelLinkedLeaf}
      style={{ ...css, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
    >
      {displayContent}
      <span className={styles.panelLinkedHint} aria-hidden="true">
        Personal info
      </span>
    </button>
  )
}

function PanelLinkedIcon({ name, color, field }: { name: IconName; color: string; field?: PersonalInfoPanelField }) {
  return (
    <button
      type="button"
      onClick={(e) => openPersonalInfo(e, field)}
      aria-label="Open Personal Info"
      title="Open Personal Info"
      className={styles.panelLinkedIcon}
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
    </button>
  )
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
        cursor: 'grab',
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
  return (
    editRef.kind === 'summary' ||
    (editRef.kind === 'entry-field' && editRef.field === 'description')
  )
}

function describeEditRef(editRef: EditRef): string {
  switch (editRef.kind) {
    case 'personal-info':
      return editRef.field
    case 'summary':
      return 'summary'
    case 'section-title':
      return `${editRef.sectionType} section title`
    case 'custom-section-title':
      return 'custom section title'
    case 'entry-field':
      return editRef.field
    case 'entry-list-item':
      return `${editRef.field} item`
    case 'entry':
      return 'entry'
  }
}

/**
 * Click-to-edit text leaf. Editing is seeded from the live Resume value
 * (via getEditRefValue), never from the rendered `displayContent` — some
 * templates apply a display-only transform (e.g. uppercasing the name) or
 * fall back to placeholder text when a field is empty, and committing either
 * of those verbatim would silently corrupt the underlying data.
 */
function EditableLeaf({
  editRef,
  displayContent,
  css,
  styleKey,
}: {
  editRef: EditRef
  displayContent: string
  css: CSSProperties
  styleKey?: string
}) {
  const [editingSeed, setEditingSeed] = useState<string | null>(null)
  const revertedRef = useRef(false)
  const isEditing = editingSeed !== null
  const multiline = isMultilineField(editRef)
  const isSectionTitle = editRef.kind === 'section-title' || editRef.kind === 'custom-section-title'

  // Announced to the store so the enclosing canvas node can stand its own ring
  // down for the duration; cleared on every exit path below.
  const startEditing = () => {
    const resume = useResumeStore.getState().activeResume
    if (!resume) return
    openEditRefInPanel(editRef)
    useEditorStore.getState().setEditingKey(styleKey ?? null)
    setEditingSeed(getEditRefValue(editRef, resume))
  }

  const stopEditing = () => {
    useEditorStore.getState().setEditingKey(null)
    setEditingSeed(null)
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (revertedRef.current) {
      revertedRef.current = false
      stopEditing()
      return
    }
    const resume = useResumeStore.getState().activeResume
    if (resume) {
      const nextValue = e.currentTarget.textContent ?? ''
      if (nextValue !== getEditRefValue(editRef, resume)) {
        applyEditRefValue(editRef, nextValue, resume)
      }
    }
    stopEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      revertedRef.current = true
      stopEditing()
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.currentTarget.blur()
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
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
        className={styles.inlineEditor}
        style={{
          ...css,
          width: '100%',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {editingSeed}
      </div>
    )
  }

  return (
    <div
      // Double click to edit, not single: a single click now selects the
      // element and hands it to the right panel, and is the start of a drag.
      // Opening a text caret on every click would make both impossible.
      onDoubleClick={(e) => {
        e.stopPropagation()
        startEditing()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault()
          e.stopPropagation()
          startEditing()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${describeEditRef(editRef)}`}
      title={isSectionTitle ? 'Double-click to rename' : 'Double-click to edit'}
      className={`${styles.editableLeaf}${isSectionTitle ? ` ${styles.editableSectionTitle}` : ''}`}
      style={{
        ...css,
        width: '100%',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {displayContent}
      <span className={styles.editableHint} aria-hidden="true">
        {isSectionTitle ? 'Double-click to rename' : 'Double-click to edit'}
      </span>
    </div>
  )
}

function ImageLeaf({
  imageId,
  clipShape,
  widthPt,
  heightPt,
  interactive,
}: {
  imageId: string | undefined
  clipShape: ClipShape | undefined
  widthPt: number
  heightPt: number
  interactive: boolean
}) {
  const url = useResolvedImageUrl(imageId)
  if (!url) return null

  const image = (
    <img
      src={url}
      alt="Profile"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: clipShapeRadius(clipShape, widthPt, heightPt),
      }}
    />
  )

  // Gallery and home-page previews sit inside links or selection buttons.
  // Their photos must not introduce a nested interactive control.
  if (!interactive) return image

  return (
    <button
      type="button"
      onClick={(e) => openPersonalInfo(e, 'profileImage')}
      aria-label="Open profile photo in Personal Info"
      title="Open profile photo settings"
      className={styles.panelLinkedImage}
    >
      {image}
    </button>
  )
}
