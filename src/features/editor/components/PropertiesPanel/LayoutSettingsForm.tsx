import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/shared/components/ui/Select/Select'
import { ControlledInput } from './ControlledFields'
import { resumeSettingsSchema, type ResumeSettingsInput } from '@/shared/schemas/settings.schema'
import { useResumeStore } from '@/shared/stores/resume.store'
import type { ResumeSettings } from '@/shared/types/resume.types'
import styles from './LayoutSettingsForm.module.css'

export function LayoutSettingsForm({ settings }: { settings: ResumeSettings }) {
  const updateSettings = useResumeStore((s) => s.updateSettings)

  const { control, handleSubmit, formState: { errors } } = useForm<ResumeSettingsInput>({
    resolver: zodResolver(resumeSettingsSchema),
    defaultValues: settings,
  })

  const save = handleSubmit((data) => { updateSettings(data) })
  const onSaved = () => { void save() }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Page Setup</h3>
        <Controller
          name="pageSize"
          control={control}
          render={({ field }) => (
            <Select
              label="Page Size"
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(e) => {
                field.onChange(e.target.value)
                void save()
              }}
              options={[
                { value: 'A4', label: 'A4 (210 × 297mm)' },
                { value: 'LETTER', label: 'Letter (8.5 × 11in)' },
              ]}
            />
          )}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Margins (mm)</h3>
        <div className={styles.marginsGrid}>
          <ControlledInput control={control} name="margins.top" label="Top" type="number" valueAsNumber error={errors.margins?.top?.message} onSaved={onSaved} />
          <ControlledInput control={control} name="margins.bottom" label="Bottom" type="number" valueAsNumber error={errors.margins?.bottom?.message} onSaved={onSaved} />
          <ControlledInput control={control} name="margins.left" label="Left" type="number" valueAsNumber error={errors.margins?.left?.message} onSaved={onSaved} />
          <ControlledInput control={control} name="margins.right" label="Right" type="number" valueAsNumber error={errors.margins?.right?.message} onSaved={onSaved} />
        </div>
      </div>
    </div>
  )
}
