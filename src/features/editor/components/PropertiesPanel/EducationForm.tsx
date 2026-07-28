import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlledInput } from './ControlledFields'
import { educationSectionSchema, type EducationSectionInput } from '@/shared/schemas/education.schema'
import type { EducationSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './EducationForm.module.css'

export function EducationForm({ section }: { section: EducationSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<EducationSectionInput>({
    resolver: zodResolver(educationSectionSchema),
    defaultValues: section,
  })

  useEffect(() => { reset(section) }, [section.id, reset, section])

  const save = handleSubmit((data) => { updateSection('education', section.id, data) })
  const onSaved = () => { void save() }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput control={control} name="institution" label="Institution" error={errors.institution?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="degree" label="Degree" error={errors.degree?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="fieldOfStudy" label="Field of study" onSaved={onSaved} />
      <ControlledInput control={control} name="location" label="Location" onSaved={onSaved} />
      <div className={styles.grid}>
        <ControlledInput control={control} name="startDate" label="Start date" onSaved={onSaved} />
        <ControlledInput control={control} name="endDate" label="End date" onSaved={onSaved} />
      </div>
      <ControlledInput control={control} name="grade" label="Grade / GPA" onSaved={onSaved} />
    </form>
  )
}
