import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlledTextarea } from './ControlledFields'
import type { SummarySection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useGuidedForm } from '../../hooks/useGuidedForm'
import { useResumeFormSync } from '../../hooks/useResumeFormSync'
import styles from './SummaryForm.module.css'

const schema = z.object({ content: z.string().max(3000) })
type FormData = z.infer<typeof schema>

export function SummaryForm({ section }: { section: SummarySection }) {
  const updateSummary = useResumeStore((s) => s.updateSummary)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: section.content },
  })
  const { control, handleSubmit, formState: { errors } } = form
  const source = useMemo(() => ({ content: section.content }), [section.content])
  const commit = useResumeFormSync(form, source, (data) => { updateSummary(data.content) })
  const guided = useGuidedForm(form, commit)

  const save = handleSubmit(commit)

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledTextarea
        control={control}
        name="content"
        label="Summary"
        required={!!guided}
        rows={6}
        showCharacterCount
        maxLength={3000}
        error={errors.content?.message}
        onSaved={() => { void save() }}
      />
    </form>
  )
}
