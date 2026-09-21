import { useEffect, useRef, useState } from 'react'
import { Download, Upload, HardDrive, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/shared/components/ui/Button/Button'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { useResumeStore } from '@/shared/stores/resume.store'
import {
  createBackup,
  downloadBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  restoreBackup,
  type ResumeBackup,
} from '@/shared/services/backup.service'
import styles from './DataBackup.module.css'

export function DataBackup() {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'read' | 'restore' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [backup, setBackup] = useState<ResumeBackup | null>(null)
  useEffect(() => {
    if (window.location.hash === '#backups') document.getElementById('backups')?.scrollIntoView()
  }, [])

  const exportAll = async () => {
    setBusy('export')
    setError(null)
    setMessage(null)
    try {
      await useResumeStore.getState().saveActiveResume()
      if (useResumeStore.getState().isDirty)
        throw new Error('Save your latest changes before creating a backup.')
      downloadBackup(await createBackup())
      setMessage('Backup downloaded. Keep it somewhere safe.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a backup. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const readFile = async (file?: File) => {
    if (!file) return
    setBusy('read')
    setError(null)
    setMessage(null)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 20 MB.')
      setBackup(parseBackup(await file.text()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this backup.')
    } finally {
      setBusy(null)
      if (input.current) input.current.value = ''
    }
  }

  const restore = async () => {
    if (!backup) return
    setBusy('restore')
    setError(null)
    try {
      const count = await restoreBackup(backup)
      setBackup(null)
      setMessage(
        `${count} resume${count === 1 ? '' : 's'} restored. Find your copies in My Resumes.`
      )
    } catch {
      setError(
        'Could not restore the backup. Check available browser storage and try again. No partial copies were saved.'
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <section id="backups" className={styles.card} aria-labelledby="backup-heading">
      <div className={styles.header}>
        <span className={styles.icon}>
          <HardDrive size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id="backup-heading">Backup</h2>
          <p>Download or restore your resumes.</p>
        </div>
      </div>
      <p className={styles.description}>
        Resumes are stored in this browser. A backup keeps your content, designs, and photos
        together if you switch devices or clear site data.
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => {
            void exportAll()
          }}
          loading={busy === 'export'}
          disabled={busy !== null}
        >
          <Download size={15} aria-hidden="true" /> Download backup
        </Button>
        <Button
          variant="ghost"
          onClick={() => input.current?.click()}
          disabled={busy !== null}
          loading={busy === 'read'}
        >
          <Upload size={15} aria-hidden="true" /> Restore backup
        </Button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          aria-label="Choose a Resume Studio backup"
          className={styles.fileInput}
          onChange={(event) => {
            void readFile(event.target.files?.[0])
          }}
        />
      </div>
      <p className={styles.note}>
        Backup files include your personal information. Store them privately.
      </p>
      {error && !backup && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={styles.success}>
          <CheckCircle2 size={16} aria-hidden="true" />
          {message} <Link to="/app">My Resumes</Link>
        </p>
      )}
      <Modal
        isOpen={backup !== null}
        onClose={() => {
          if (!busy) {
            setBackup(null)
            setError(null)
          }
        }}
        title="Restore your resumes"
        maxWidth="md"
      >
        {backup && (
          <div className={styles.restore}>
            <p>
              <strong>
                {backup.resumes.length} resume{backup.resumes.length === 1 ? '' : 's'}
              </strong>{' '}
              · Backed up {new Date(backup.exportedAt).toLocaleDateString()}
            </p>
            <ul>
              {backup.resumes.slice(0, 5).map((resume) => (
                <li key={resume.id}>{resume.title}</li>
              ))}
              {backup.resumes.length > 5 && <li>and {backup.resumes.length - 5} more</li>}
            </ul>
            <p>
              Each resume will be added as a new copy. Your existing work and preferences stay as
              they are.
            </p>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setBackup(null)
                  setError(null)
                }}
                disabled={busy !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void restore()
                }}
                loading={busy === 'restore'}
              >
                Restore copies
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
