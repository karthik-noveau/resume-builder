import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useResumeStore } from '@/shared/stores/resume.store'
import styles from './ResumeTitle.module.css'

export function ResumeTitle({ title }: { title: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const finish = () => {
    const value = draft.trim()
    if (value && value !== title) useResumeStore.getState().updateResume({ title: value })
    setEditing(false)
  }
  return (
    <h1 className={styles.root}>
      {editing ? (
        <input
          autoFocus
          aria-label="Resume title"
          value={draft}
          maxLength={120}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finish}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          title="Rename resume"
          aria-label={`Rename ${title}`}
          onClick={() => {
            setDraft(title)
            setEditing(true)
          }}
        >
          <span>{title || 'Untitled Resume'}</span>
          <Pencil size={12} aria-hidden="true" />
        </button>
      )}
    </h1>
  )
}
