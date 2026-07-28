import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StringListField } from '@/shared/components/ui/StringListField/StringListField'
import { ControlledInput, ControlledCheckbox } from './ControlledFields'
import { experienceSectionSchema, type ExperienceSectionInput } from '@/shared/schemas/experience.schema'
import type { ExperienceSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './ExperienceForm.module.css'

export function ExperienceForm({ section }: { section: ExperienceSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExperienceSectionInput>({
    resolver: zodResolver(experienceSectionSchema),
    defaultValues: section,
  })

  useEffect(() => { reset(section) }, [section.id, reset, section])

  const current = useWatch({ control, name: 'current' })
  const save = handleSubmit((data) => { updateSection('experience', section.id, data) })
  const onSaved = () => { void save() }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput control={control} name="company" label="Company" error={errors.company?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="role" label="Role / Job title" error={errors.role?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="location" label="Location" onSaved={onSaved} />
      <div className={styles.grid}>
        <ControlledInput control={control} name="startDate" label="Start date" placeholder="Jan 2020" onSaved={onSaved} />
        <ControlledInput control={control} name="endDate" label="End date" placeholder="Present" disabled={current} onSaved={onSaved} />
      </div>
      <ControlledCheckbox control={control} name="current" label="Currently working here" onSaved={onSaved} />

      <StringListField
        label="Achievements / bullet points"
        items={section.description}
        onChange={(description) => updateSection('experience', section.id, { description })}
        placeholder="Led a team of..."
        addLabel="Add bullet point"
        multiline
      />

      <StringListField
        label="Technologies"
        items={section.technologies}
        onChange={(technologies) => updateSection('experience', section.id, { technologies })}
        placeholder="e.g. React"
        addLabel="Add technology"
      />
    </form>
  )
}
