import { useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { Textarea } from '@/shared/components/ui/Textarea/Textarea'
import styles from './ImportResumeModal.module.css'

interface ImportResumeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (rawText: string) => void
  isLoading?: boolean
}

export function ImportResumeModal({ isOpen, onClose, onConfirm, isLoading }: ImportResumeModalProps) {
  const [rawText, setRawText] = useState('')

  const handleClose = () => {
    setRawText('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import resume" maxWidth="lg">
      <div className={styles.root}>
        <p className={styles.description}>
          Paste your existing resume text below. We'll do our best to pull out
          your name, contact details, and sections — it's a rough first pass,
          so review and adjust everything afterward in the editor.
        </p>

        <Textarea
          label="Resume text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your resume text here…"
          rows={14}
          disabled={isLoading}
        />

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(rawText)}
            loading={isLoading}
            disabled={!rawText.trim()}
          >
            Import & Continue
          </Button>
        </div>
      </div>
    </Modal>
  )
}
