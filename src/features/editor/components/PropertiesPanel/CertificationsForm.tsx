import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlledInput } from './ControlledFields'
import { certificationSectionSchema, type CertificationSectionInput } from '@/shared/schemas/certifications.schema'
import type { CertificationSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './CertificationsForm.module.css'

export function CertificationsForm({ section }: { section: CertificationSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CertificationSectionInput>({
    resolver: zodResolver(certificationSectionSchema),
    defaultValues: section,
  })

  useEffect(() => { reset(section) }, [section.id, reset, section])

  const save = handleSubmit((data) => { updateSection('certifications', section.id, data) })
  const onSaved = () => { void save() }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput control={control} name="title" label="Certification title" error={errors.title?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="issuer" label="Issuing organization" error={errors.issuer?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="issueDate" label="Issue date" placeholder="Jan 2023" onSaved={onSaved} />
      <ControlledInput control={control} name="credentialId" label="Credential ID" onSaved={onSaved} />
      <ControlledInput control={control} name="credentialUrl" label="Credential URL" type="url" error={errors.credentialUrl?.message} onSaved={onSaved} />
    </form>
  )
}
