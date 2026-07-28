import { Plus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/shared/components/ui/Button/Button'
import { useAutoGrowTextarea } from '@/shared/hooks/useAutoGrowTextarea'
import styles from './StringListField.module.css'

interface StringListFieldProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
  multiline?: boolean
}

/** One growing textarea row — needs its own hook instance per item, so it can't live inline in a .map(). */
function AutoGrowRow({
  value,
  placeholder,
  onChange,
  className,
}: {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  className: string
}) {
  const autoGrowRef = useAutoGrowTextarea(value)
  return (
    <textarea
      ref={autoGrowRef}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  )
}

/** Add/edit/remove list of plain strings — used for bullet points and tech/tag lists. */
export function StringListField({
  label,
  items,
  onChange,
  placeholder,
  addLabel = 'Add',
  multiline = false,
}: StringListFieldProps) {
  const updateItem = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChange([...items, ''])
  }

  const fieldClasses = clsx(styles.field, multiline ? styles.fieldMultiline : styles.fieldSingle)

  return (
    <div className={styles.root}>
      <p className={styles.label}>{label}</p>

      {items.map((item, index) => (
        <div key={index} className={styles.row}>
          {multiline ? (
            <AutoGrowRow
              value={item}
              placeholder={placeholder}
              onChange={(value) => updateItem(index, value)}
              className={fieldClasses}
            />
          ) : (
            <input
              type="text"
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateItem(index, e.target.value)}
              className={fieldClasses}
            />
          )}
          <button
            type="button"
            aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`}
            onClick={() => removeItem(index)}
            className={styles.removeButton}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <Button type="button" variant="secondary" className={styles.addButton} onClick={addItem}>
        <Plus size={14} />
        {addLabel}
      </Button>
    </div>
  )
}
