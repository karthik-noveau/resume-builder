import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlledTextarea } from './ControlledFields'
import type { SummarySection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './SummaryForm.module.css'

const schema = z.object({ content: z.string().max(3000) })
type FormData = z.infer<typeof schema>

export function SummaryForm({ section }: { section: SummarySection }) {
  const updateSummary = useResumeStore((s) => s.updateSummary)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: section.content },
  })

  useEffect(() => { reset({ content: section.content }) }, [section.id, reset, section.content])

  const save = handleSubmit((data) => { updateSummary(data.content) })

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledTextarea
        control={control}
        name="content"
        label="Summary"
        rows={6}
        showCharacterCount
        maxLength={3000}
        error={errors.content?.message}
        onSaved={() => { void save() }}
      />
    </form>
  )
}
