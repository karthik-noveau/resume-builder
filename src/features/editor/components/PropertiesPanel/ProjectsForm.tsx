import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StringListField } from '@/shared/components/ui/StringListField/StringListField'
import { ControlledInput, ControlledTextarea } from './ControlledFields'
import { projectSectionSchema, type ProjectSectionInput } from '@/shared/schemas/projects.schema'
import type { ProjectSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './ProjectsForm.module.css'

export function ProjectsForm({ section }: { section: ProjectSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProjectSectionInput>({
    resolver: zodResolver(projectSectionSchema),
    defaultValues: section,
  })

  useEffect(() => { reset(section) }, [section.id, reset, section])

  const save = handleSubmit((data) => { updateSection('projects', section.id, data) })
  const onSaved = () => { void save() }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput control={control} name="title" label="Project title" error={errors.title?.message} onSaved={onSaved} />
      <ControlledTextarea control={control} name="description" label="Description" rows={3} error={errors.description?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="url" label="Live URL" type="url" error={errors.url?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="github" label="GitHub URL" type="url" error={errors.github?.message} onSaved={onSaved} />
      <div className={styles.grid}>
        <ControlledInput control={control} name="startDate" label="Start date" onSaved={onSaved} />
        <ControlledInput control={control} name="endDate" label="End date" onSaved={onSaved} />
      </div>

      <StringListField
        label="Technologies"
        items={section.technologies}
        onChange={(technologies) => updateSection('projects', section.id, { technologies })}
        placeholder="e.g. TypeScript"
        addLabel="Add technology"
      />
    </form>
  )
}
