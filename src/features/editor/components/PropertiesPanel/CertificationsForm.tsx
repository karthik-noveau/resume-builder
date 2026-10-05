import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlledInput } from './ControlledFields'
import { certificationSectionSchema, type CertificationSectionInput } from '@/shared/schemas/certifications.schema'
import type { CertificationSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useResumeFormSync } from '../../hooks/useResumeFormSync'
import styles from './CertificationsForm.module.css'

export function CertificationsForm({ section }: { section: CertificationSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const form = useForm<CertificationSectionInput>({
    resolver: zodResolver(certificationSectionSchema),
    defaultValues: section,
  })

  const { control, formState: { errors } } = form
  const commit = useResumeFormSync<CertificationSectionInput>(form, section, (data) => { updateSection('certifications', section.id, data) })
  const onSaved = () => {
    void commit(form.getValues())
    void form.trigger()
  }

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
