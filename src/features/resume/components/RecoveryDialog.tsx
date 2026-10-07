import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileText, History, RotateCcw, Trash2 } from 'lucide-react'
import { storageService } from '@/shared/services/storage.service'
import { useResumeStore } from '@/shared/stores/resume.store'
import type { Resume } from '@/shared/types/resume.types'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { prepareExport } from '@/features/editor/utils/prepareExport'
import styles from './RecoveryDialog.module.css'

interface Entry {
  id: string
  date: string
  resume: Resume
}

export function RecoveryDialog({ resumeId, onClose }: { resumeId?: string; onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [remove, setRemove] = useState<Entry | null>(null)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (resumeId) {
          await prepareExport()
          await useResumeStore.getState().saveActiveResume()
          if (useResumeStore.getState().error) throw new Error(useResumeStore.getState().error!)
        }
        const list = resumeId
          ? (await storageService.getVersions(resumeId)).map((v) => ({
              id: v.id,
              date: v.savedAt,
              resume: v.resume,
            }))
          : (await storageService.getTrash()).map((v) => ({
              id: v.id,
              date: v.deletedAt,
              resume: v.resume,
            }))
        if (active) setEntries(list)
      } catch (cause) {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Could not load saved versions.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [resumeId])

  const restore = async (entry: Entry) => {
    setBusy(true)
    setError('')
    try {
      if (resumeId) {
        const state = useResumeStore.getState()
        if (state.activeResume?.id !== resumeId)
          throw new Error('Open this resume again before restoring.')
        state.updateResume({ ...entry.resume, revision: state.activeResume.revision })
        await state.saveActiveResume()
        if (useResumeStore.getState().error) throw new Error(useResumeStore.getState().error!)
      } else {
        await storageService.restoreTrashedResume(entry.id)
        await useResumeStore.getState().loadResumeList()
        void navigate(`/editor/${entry.id}`)
      }
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not restore this resume.')
    } finally {
      setBusy(false)
    }
  }
  const permanentlyDelete = async () => {
    if (!remove) return
    setBusy(true)
    setError('')
    try {
      await storageService.permanentlyDeleteResume(remove.id)
      setEntries((list) => list.filter((v) => v.id !== remove.id))
      setRemove(null)
    } catch {
      setError('Could not permanently delete this resume. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Modal
        isOpen
        centered
        className={styles.modal}
        title={resumeId ? 'Version history' : 'Trash'}
        onClose={() => {
          if (!busy) onClose()
        }}
        maxWidth={resumeId ? 'lg' : 'md'}
      >
        <div className={styles.content}>
          <p className={styles.detail}>
            {resumeId
              ? 'Your last 30 saved versions on this device. Restoring a version also keeps your current work in history.'
              : 'Deleted resumes stay here until you restore or permanently delete them.'}
          </p>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {loading ? (
            <div className={styles.empty}>
              <Spinner size={28} label={resumeId ? 'Loading saved versions…' : 'Loading Trash…'} />
            </div>
          ) : !entries.length && !error ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                {resumeId ? (
                  <History size={29} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Trash2 size={29} strokeWidth={1.5} aria-hidden="true" />
                )}
              </span>
              <h3>{resumeId ? 'No earlier versions yet' : 'Trash is empty.'}</h3>
              <p>
                {resumeId
                  ? 'Edit and save your resume to start its history.'
                  : 'Deleted resumes will appear here, ready to restore when you need them.'}
              </p>
            </div>
          ) : entries.length > 0 ? (
            <>
              <p className={styles.listLabel}>
                {entries.length}{' '}
                {resumeId
                  ? entries.length === 1
                    ? 'saved version'
                    : 'saved versions'
                  : entries.length === 1
                    ? 'deleted resume'
                    : 'deleted resumes'}
              </p>
              <ul className={styles.list}>
                {entries.map((entry) => (
                  <li key={entry.id} className={styles.row}>
                    <div className={styles.rowHeader}>
                      <span className={styles.resumeIcon}>
                        <FileText size={21} aria-hidden="true" />
                      </span>
                      <div className={styles.rowTitle}>
                        <strong>{entry.resume.title || 'Untitled Resume'}</strong>
                        <span className={styles.detail}>
                          {entry.resume.personalInfo.fullName || 'Name not added'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.date}>
                      {resumeId ? 'Saved' : 'Deleted'}{' '}
                      <time dateTime={entry.date}>{new Date(entry.date).toLocaleString()}</time>
                    </p>
                    {resumeId && (
                      <p className={styles.detail}>
                        {entry.resume.summary.content.slice(0, 160) ||
                          `${entry.resume.experience.length} work entries · ${entry.resume.education.length} education entries`}
                      </p>
                    )}
                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        className={styles.restoreButton}
                        disabled={busy}
                        onClick={() => void restore(entry)}
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                        {resumeId ? 'Restore this version' : 'Restore resume'}
                      </Button>
                      {!resumeId && (
                        <Button
                          variant="ghost"
                          className={styles.deleteButton}
                          disabled={busy}
                          onClick={() => setRemove(entry)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete permanently
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Done
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={!!remove}
        title="Delete permanently?"
        description={`“${remove?.resume.title ?? ''}”, its photos and saved versions will be removed. This cannot be undone.`}
        confirmLabel="Delete permanently"
        cancelLabel="Keep in Trash"
        variant="danger"
        loading={busy}
        onClose={() => {
          if (!busy) setRemove(null)
        }}
        onConfirm={() => void permanentlyDelete()}
      />
    </>
  )
}
