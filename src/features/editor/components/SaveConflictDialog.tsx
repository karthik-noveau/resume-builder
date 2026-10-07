import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useResumeStore } from '@/shared/stores/resume.store'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from '@/features/resume/components/RecoveryDialog.module.css'

export function SaveConflictDialog() {
  const conflict = useResumeStore((s) => s.conflict)
  const resolve = useResumeStore((s) => s.resolveConflict)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const choose = async (choice: 'reload' | 'copy') => {
    setBusy(true)
    setError('')
    try {
      const id = await resolve(choice)
      void navigate(`/editor/${id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not recover this draft. Try again.')
    } finally {
      setBusy(false)
    }
  }
  if (!conflict) return null
  return (
    <Modal
      isOpen
      title="This resume changed in another tab"
      onClose={() => {
        if (!busy) useResumeStore.setState({ conflict: false })
      }}
    >
      <div className={styles.content}>
        <p>Your draft is still here. Saving has paused to protect the other tab’s changes.</p>
        <p>
          Keep both versions by saving this draft as a copy, or discard this draft and reload the
          saved version.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" disabled={busy} onClick={() => void choose('reload')}>
            Reload saved version
          </Button>
          <Button disabled={busy} onClick={() => void choose('copy')}>
            Save my draft as a copy
          </Button>
        </div>
      </div>
    </Modal>
  )
}
