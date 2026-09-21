import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useEffect, useRef, type ReactNode } from 'react'
import { useEditorStore } from '@/shared/stores/editor.store'
import styles from './EntryCard.module.css'

interface EntryCardProps {
  id: string
  title: string
  subtitle?: string
  isVisible: boolean
  onToggleVisibility: () => void
  onDelete: () => void
  children: ReactNode
}

/** Wraps a single entry (one job, one degree, one project, etc.) with drag-to-reorder, hide, and delete. */
export function EntryCard({ id, title, subtitle, isVisible, onToggleVisibility, onDelete, children }: EntryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const cardRef = useRef<HTMLDivElement | null>(null)
  const isSelected = useEditorStore((state) => state.selectedEntryId === id)

  useEffect(() => {
    if (isSelected) cardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [isSelected])

  const setCardRef = (node: HTMLDivElement | null) => {
    cardRef.current = node
    setNodeRef(node)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setCardRef}
      style={style}
      className={clsx(styles.card, isSelected && styles.cardSelected)}
      data-entry-id={id}
    >
      <div className={styles.header}>
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder ${title || 'entry'}`}
          data-drag-handle
          className={clsx(styles.dragHandle, styles.revealable)}
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>

        <div className={clsx(styles.titleGroup, !isVisible && styles.titleGroupHidden)}>
          <p className={styles.title}>{title || 'Untitled'}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <button
          aria-label={isVisible ? `Hide ${title || 'entry'}` : `Show ${title || 'entry'}`}
          onClick={onToggleVisibility}
          className={clsx(styles.visibilityButton, styles.revealable)}
        >
          {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        </button>

        <button
          aria-label={`Delete ${title || 'entry'}`}
          onClick={onDelete}
          className={clsx(styles.deleteButton, styles.revealable)}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>{children}</div>
    </div>
  )
}
