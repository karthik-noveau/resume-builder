import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/shared/components/ui/Select/Select'
import { ControlledInput } from '../PropertiesPanel/ControlledFields'
import { resumeSettingsSchema, type ResumeSettingsInput } from '@/shared/schemas/settings.schema'
import { useResumeStore } from '@/shared/stores/resume.store'
import type { ResumeSettings } from '@/shared/types/resume.types'
import styles from './LayoutSettingsForm.module.css'

export function LayoutSettingsForm({ settings }: { settings: ResumeSettings }) {
  const updateSettings = useResumeStore((s) => s.updateSettings)

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ResumeSettingsInput>({
    resolver: zodResolver(resumeSettingsSchema),
    defaultValues: settings,
  })

  const save = handleSubmit((data) => { updateSettings(data) })
  const onSaved = () => { void save() }
  const margins = watch('margins')

  const applyMarginPreset = (value: number) => {
    const nextMargins = { top: value, right: value, bottom: value, left: value }
    setValue('margins', nextMargins, { shouldDirty: true, shouldValidate: true })
    updateSettings({ margins: nextMargins })
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <div>
          <h3 className={styles.sectionTitle}>Content spacing</h3>
          <p className={styles.sectionHint}>Adjust the rhythm between sections and entries.</p>
        </div>
        <div className={styles.presetGrid} aria-label="Content spacing presets">
          {(['compact', 'balanced', 'spacious'] as const).map((value) => (
            <button
              type="button"
              className={styles.presetButton}
              aria-pressed={(settings.spacingDensity ?? 'balanced') === value}
              onClick={() => updateSettings({ spacingDensity: value })}
              key={value}
            >
              <span>{value[0].toUpperCase() + value.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div>
          <h3 className={styles.sectionTitle}>Document size</h3>
          <p className={styles.sectionHint}>Choose the format required by the employer.</p>
        </div>
        <Controller
          name="pageSize"
          control={control}
          render={({ field }) => (
            <Select
              label="Page size"
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
        <div>
          <h3 className={styles.sectionTitle}>Page margins</h3>
          <p className={styles.sectionHint}>Use a preset or adjust each edge in millimetres.</p>
        </div>
        <div className={styles.presetGrid} aria-label="Margin presets">
          {[
            { label: 'Compact', value: 12 },
            { label: 'Balanced', value: 18 },
            { label: 'Airy', value: 24 },
          ].map((preset) => {
            const active = Object.values(margins).every((value) => value === preset.value)
            return (
              <button
                type="button"
                className={styles.presetButton}
                aria-pressed={active}
                onClick={() => applyMarginPreset(preset.value)}
                key={preset.label}
              >
                <span>{preset.label}</span>
                <small>{preset.value} mm</small>
              </button>
            )
          })}
        </div>
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
