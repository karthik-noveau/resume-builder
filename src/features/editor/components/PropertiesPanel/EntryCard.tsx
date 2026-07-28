import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.card}>
      <div className={styles.header}>
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder ${title || 'entry'}`}
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
