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
import type { BaseSectionContract, Resume, SectionType } from '@/shared/types/resume.types'
import { IconPicker } from '@/shared/components/IconPicker/IconPicker'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { resolveSectionIcon, sectionIconKey } from '@/features/templates/engine/icons'
import { ExperienceForm } from './ExperienceForm'
import { EducationForm } from './EducationForm'
import { SkillsForm } from './SkillsForm'
import { ProjectsForm } from './ProjectsForm'
import { CertificationsForm } from './CertificationsForm'
import { CustomSectionForm } from './CustomSectionForm'
import { SummaryForm } from './SummaryForm'
import { EntryCard } from './EntryCard'
import { Button } from '@/shared/components/ui/Button/Button'
import { Inbox, Plus } from 'lucide-react'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './SectionProperties.module.css'

interface SectionPropertiesProps {
  resume: Resume
  sectionType: SectionType
}

interface EntryListProps<T extends BaseSectionContract> {
  sectionType: SectionType
  entries: T[]
  getTitle: (entry: T) => string
  getSubtitle?: (entry: T) => string | undefined
  renderForm: (entry: T) => React.ReactNode
  addLabel: string
}

function EntryList<T extends BaseSectionContract>({
  sectionType,
  entries,
  getTitle,
  getSubtitle,
  renderForm,
  addLabel,
}: EntryListProps<T>) {
  const addSection = useResumeStore((s) => s.addSection)
  const deleteSection = useResumeStore((s) => s.deleteSection)
  const reorderSections = useResumeStore((s) => s.reorderSections)
  const updateSection = useResumeStore((s) => s.updateSection)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = entries.findIndex((e) => e.id === active.id)
    const toIndex = entries.findIndex((e) => e.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSections(sectionType, fromIndex, toIndex)
    }
  }

  return (
    <div className={styles.list}>
      {entries.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <Inbox size={18} />
          </div>
          <p className={styles.emptyTitle}>No entries yet</p>
          <p className={styles.emptyDescription}>Add one to get started.</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.entries}>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                id={entry.id}
                title={getTitle(entry)}
                subtitle={getSubtitle?.(entry)}
                isVisible={entry.visible}
                onToggleVisibility={() => updateSection(sectionType, entry.id, { visible: !entry.visible })}
                onDelete={() => deleteSection(sectionType, entry.id)}
              >
                {renderForm(entry)}
              </EntryCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="secondary" className={styles.addButton} onClick={() => addSection(sectionType)}>
        <Plus size={14} className={styles.addIcon} />
        {addLabel}
      </Button>
    </div>
  )
}

/**
 * Icon chooser for the active section, shown only when the current template
 * actually draws section-header icons (`TemplateDefinition.sectionIcons`).
 * Offering it on a template that never renders one would be a dead control.
 */
function SectionIconField({ resume, sectionType }: SectionPropertiesProps) {
  const setSectionIcon = useResumeStore((s) => s.setSectionIcon)
  const template = ALL_TEMPLATES.find((t) => t.id === resume.templateId)
  const templateDefault = template?.sectionIcons?.[sectionType]
  if (!templateDefault) return null

  // Custom sections are keyed individually so each can carry its own icon.
  // With several present, the panel edits them as one group, so key off the
  // first — matching what the sidebar list selects.
  const customId = sectionType === 'custom' ? resume.customSections[0]?.id : undefined
  const key = sectionIconKey(sectionType, customId)
  const override = resume.sectionIcons?.[key]

  return (
    <div className={styles.iconField}>
      <IconPicker
        value={resolveSectionIcon(resume, sectionType, templateDefault, customId)}
        isDefault={!override}
        onChange={(icon) => setSectionIcon(key, icon)}
        onReset={() => setSectionIcon(key, null)}
      />
    </div>
  )
}

export function SectionProperties(props: SectionPropertiesProps) {
  return (
    <>
      <SectionIconField {...props} />
      <SectionBody {...props} />
    </>
  )
}

function SectionBody({ resume, sectionType }: SectionPropertiesProps) {
  switch (sectionType) {
    case 'summary':
      return <SummaryForm section={resume.summary} />

    case 'experience':
      return (
        <EntryList
          sectionType="experience"
          entries={resume.experience}
          getTitle={(e) => e.role || 'New Experience'}
          getSubtitle={(e) => e.company}
          renderForm={(e) => <ExperienceForm section={e} />}
          addLabel="Add Experience"
        />
      )

    case 'education':
      return (
        <EntryList
          sectionType="education"
          entries={resume.education}
          getTitle={(e) => e.degree || 'New Education'}
          getSubtitle={(e) => e.institution}
          renderForm={(e) => <EducationForm section={e} />}
          addLabel="Add Education"
        />
      )

    case 'skills':
      return (
        <EntryList
          sectionType="skills"
          entries={resume.skills}
          getTitle={(e) => e.category || 'New Category'}
          getSubtitle={(e) => `${e.skills.length} skill${e.skills.length === 1 ? '' : 's'}`}
          renderForm={(e) => <SkillsForm section={e} />}
          addLabel="Add Skill Category"
        />
      )

    case 'projects':
      return (
        <EntryList
          sectionType="projects"
          entries={resume.projects}
          getTitle={(e) => e.title || 'New Project'}
          renderForm={(e) => <ProjectsForm section={e} />}
          addLabel="Add Project"
        />
      )

    case 'certifications':
      return (
        <EntryList
          sectionType="certifications"
          entries={resume.certifications}
          getTitle={(e) => e.title || 'New Certification'}
          getSubtitle={(e) => e.issuer}
          renderForm={(e) => <CertificationsForm section={e} />}
          addLabel="Add Certification"
        />
      )

    case 'custom':
      return (
        <EntryList
          sectionType="custom"
          entries={resume.customSections}
          getTitle={(e) => e.title || 'Custom Section'}
          getSubtitle={(e) => `${e.items.length} item${e.items.length === 1 ? '' : 's'}`}
          renderForm={(e) => <CustomSectionForm section={e} />}
          addLabel="Add Custom Section"
        />
      )
  }
}
