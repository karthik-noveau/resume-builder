import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignLeft, Briefcase, GraduationCap, Zap, FolderOpen, Award, LayoutList,
  GripVertical, Eye, EyeOff, ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { SectionType } from '@/shared/types/resume.types'
import styles from './SectionListItem.module.css'

const SECTION_META: Record<SectionType, { label: string; Icon: React.ElementType }> = {
  summary: { label: 'Summary', Icon: AlignLeft },
  experience: { label: 'Experience', Icon: Briefcase },
  education: { label: 'Education', Icon: GraduationCap },
  skills: { label: 'Skills', Icon: Zap },
  projects: { label: 'Projects', Icon: FolderOpen },
  certifications: { label: 'Certifications', Icon: Award },
  custom: { label: 'Custom', Icon: LayoutList },
}

interface SectionListItemProps {
  id: string
  sectionType: SectionType
  count: number
  isSelected: boolean
  isVisible: boolean
  onSelect: () => void
  onToggleVisibility: () => void
}

export function SectionListItem({
  id,
  sectionType,
  count,
  isSelected,
  isVisible,
  onSelect,
  onToggleVisibility,
}: SectionListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const { label, Icon } = SECTION_META[sectionType]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(styles.row, isSelected && styles.rowSelected)}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        aria-label={`Drag to reorder ${label}`}
        data-drag-handle
        className={clsx(styles.dragHandle, styles.revealable)}
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>

      {/* Main selection button */}
      <button
        onClick={onSelect}
        aria-label={`Edit ${label} section`}
        className={clsx(styles.selectButton, isSelected && styles.selectButtonActive)}
        aria-current={isSelected ? 'true' : undefined}
      >
        <Icon size={15} aria-hidden="true" className={styles.icon} />
        <span className={styles.label}>{label}</span>
        {count > 0 && (
          <span className={styles.count}>{count}</span>
        )}
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={clsx(styles.chevron, isSelected && styles.chevronVisible)}
        />
      </button>

      {/* Visibility toggle */}
      <button
        aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
        onClick={onToggleVisibility}
        className={clsx(styles.visibilityButton, styles.revealable)}
      >
        {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
      </button>
    </div>
  )
}
