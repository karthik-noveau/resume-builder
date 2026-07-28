import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { ControlledInput } from './ControlledFields'
import type { CustomSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './CustomSectionForm.module.css'

const schema = z.object({ title: z.string().min(1, 'Title is required') })
type FormData = z.infer<typeof schema>

export function CustomSectionForm({ section }: { section: CustomSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: section.title },
  })

  useEffect(() => { reset({ title: section.title }) }, [section.id, reset, section.title])

  const save = handleSubmit((data) => { updateSection('custom', section.id, data) })

  const addItem = () => {
    updateSection('custom', section.id, {
      items: [...section.items, { id: crypto.randomUUID(), title: '', subtitle: '', description: '' }],
    })
  }

  const updateItem = (itemId: string, patch: Partial<{ title: string; subtitle: string }>) => {
    updateSection('custom', section.id, {
      items: section.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    })
  }

  const removeItem = (itemId: string) => {
    updateSection('custom', section.id, {
      items: section.items.filter((i) => i.id !== itemId),
    })
  }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput
        control={control}
        name="title"
        label="Section title"
        error={errors.title?.message}
        onSaved={() => { void save() }}
      />

      <div className={styles.itemsSection}>
        <p className={styles.itemsLabel}>Items</p>
        {section.items.map((item) => (
          <div key={item.id} className={styles.itemRow}>
            <input
              type="text"
              value={item.title}
              placeholder="e.g. English"
              onChange={(e) => updateItem(item.id, { title: e.target.value })}
              className={styles.itemInput}
            />
            <input
              type="text"
              value={item.subtitle}
              placeholder="e.g. Native"
              onChange={(e) => updateItem(item.id, { subtitle: e.target.value })}
              className={styles.itemInput}
            />
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => removeItem(item.id)}
              className={styles.removeButton}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <Button type="button" variant="secondary" className={styles.addButton} onClick={addItem}>
          <Plus size={14} className={styles.addIcon} />
          Add item
        </Button>
      </div>
    </form>
  )
}
