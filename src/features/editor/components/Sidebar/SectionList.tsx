import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import type { Resume, SectionType } from '@/shared/types/resume.types'
import { SectionListItem } from './SectionListItem'
import styles from './SectionList.module.css'

function getSectionCount(resume: Resume, type: SectionType): number {
  switch (type) {
    case 'experience': return resume.experience.length
    case 'education': return resume.education.length
    case 'skills': return resume.skills.length
    case 'projects': return resume.projects.length
    case 'certifications': return resume.certifications.length
    case 'custom': return resume.customSections.length
    case 'summary': return 1
  }
}

function getSectionVisible(resume: Resume, type: SectionType): boolean {
  switch (type) {
    case 'experience': return resume.experience.some((e) => e.visible)
    case 'education': return resume.education.some((e) => e.visible)
    case 'skills': return resume.skills.some((e) => e.visible)
    case 'projects': return resume.projects.some((e) => e.visible)
    case 'certifications': return resume.certifications.some((e) => e.visible)
    case 'custom': return resume.customSections.some((e) => e.visible)
    case 'summary': return resume.summary.visible
  }
}

interface SectionListProps {
  resume: Resume
  selectedSectionType: SectionType | null
  onSelectSection: (type: SectionType) => void
  onReorderBlocks: (fromIndex: number, toIndex: number) => void
  onToggleVisibility: (type: SectionType) => void
}

export function SectionList({
  resume,
  selectedSectionType,
  onSelectSection,
  onReorderBlocks,
  onToggleVisibility,
}: SectionListProps) {
  const visibleSectionOrder = resume.sectionOrder.filter((type) => type !== 'custom')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = resume.sectionOrder.indexOf(active.id as SectionType)
    const toIndex = resume.sectionOrder.indexOf(over.id as SectionType)
    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderBlocks(fromIndex, toIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleSectionOrder} strategy={verticalListSortingStrategy}>
        <ul aria-label="Resume sections" className={styles.list}>
          {visibleSectionOrder.map((type) => (
            <li key={type}>
              <SectionListItem
                id={type}
                sectionType={type}
                count={getSectionCount(resume, type)}
                isSelected={selectedSectionType === type}
                isVisible={getSectionVisible(resume, type)}
                onSelect={() => onSelectSection(type)}
                onToggleVisibility={() => onToggleVisibility(type)}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
