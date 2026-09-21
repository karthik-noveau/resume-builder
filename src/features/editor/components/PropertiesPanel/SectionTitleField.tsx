import { useEffect, useState } from 'react'
import { Input } from '@/shared/components/ui/Input/Input'
import type { Resume } from '@/shared/types/resume.types'
import type { EditRef } from '@/shared/types/layout.types'
import { applyEditRefValue, getEditRefValue } from '../../utils/editRefResolver'
import styles from './SectionTitleField.module.css'

export type SectionTitleEditRef = Extract<EditRef, { kind: 'section-title' }>

interface SectionTitleFieldProps {
  resume: Resume
  editRef: SectionTitleEditRef
}

export function SectionTitleField({ resume, editRef }: SectionTitleFieldProps) {
  const savedValue = getEditRefValue(editRef, resume)
  const [value, setValue] = useState(savedValue)
  const [error, setError] = useState<string>()

  useEffect(() => {
    setValue(savedValue)
    setError(undefined)
  }, [savedValue])

  const save = (nextValue: string) => {
    const title = nextValue.trim()
    if (!title) {
      setError('Section title is required')
      return
    }
    setError(undefined)
    setValue(title)
    if (title !== savedValue) applyEditRefValue(editRef, title, resume)
  }

  return (
    <div className={styles.root}>
      <Input
        label="Section title"
        value={value}
        maxLength={100}
        error={error}
        helperText="Shown as the heading on your resume."
        onChange={(event) => {
          setValue(event.target.value)
          if (error) setError(undefined)
        }}
        onBlur={(event) => save(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            event.currentTarget.value = savedValue
            setValue(savedValue)
            setError(undefined)
            event.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
