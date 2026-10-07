import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Eye, FilePenLine, Info, Link2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { prepareExport } from '@/features/editor/utils/prepareExport'
import { createShareLink } from './share.service'
import type { Resume } from '@/shared/types/resume.types'
import styles from './Share.module.css'

export function ShareDialog({
  resumeId,
  resume: cardResume,
  onClose,
}: {
  resumeId: string
  resume?: Resume
  onClose: () => void
}) {
  const [link, setLink] = useState('')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const request = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const generate = useCallback(async () => {
    const generation = ++request.current
    setLink('')
    setError('')
    setCopied(false)
    setCopyError(false)
    try {
      // Dashboard cards carry their own complete resume. Editor sharing first
      // flushes the current field, even before autosave finishes.
      const resume = cardResume ?? (await prepareExport())
      if (!resume || resume.id !== resumeId) throw new Error('Open a resume before sharing it.')
      const url = await createShareLink(resume, window.location.origin, mode)
      if (generation === request.current) setLink(url)
    } catch (cause) {
      if (generation === request.current)
        setError(
          cause instanceof Error ? cause.message : 'Couldn’t create a share link. Try again.'
        )
    }
  }, [cardResume, resumeId, mode])
  const cancelGeneration = useCallback(() => {
    request.current++
  }, [])
  useEffect(() => {
    void generate()
    return cancelGeneration
  }, [generate, cancelGeneration])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopied(false)
      setCopyError(true)
      input.current?.focus()
      input.current?.select()
    }
  }

  return (
    <Modal isOpen centered onClose={onClose} title="Share resume" className={styles.modal}>
      <div className={styles.shareContent}>
        <p className={styles.intro}>Send your resume with its design and photo included.</p>
        <fieldset className={styles.modeOptions}>
          <legend>How should the link open?</legend>
          {([
            { value: 'view', title: 'Read-only preview', description: 'View and download', Icon: Eye },
            { value: 'edit', title: 'Editable copy', description: 'Edit their own version', Icon: FilePenLine },
          ] as const).map(({ value, title, description, Icon }) => (
            <label key={value} className={styles.modeOption} data-selected={mode === value}>
              <input
                type="radio"
                name={`share-mode-${resumeId}`}
                checked={mode === value}
                onChange={() => setMode(value)}
                aria-labelledby={`share-${value}-${resumeId}`}
                aria-describedby={`share-${value}-${resumeId}-description`}
              />
              <span className={styles.modeIcon}><Icon size={19} aria-hidden="true" /></span>
              <span className={styles.modeCopy}>
                <span id={`share-${value}-${resumeId}`} className={styles.modeTitle}>{title}</span>
                <span id={`share-${value}-${resumeId}-description`} className={styles.modeDescription}>{description}</span>
              </span>
              <span className={styles.modeCheck} aria-hidden="true">
                {mode === value && <Check size={12} strokeWidth={3} />}
              </span>
            </label>
          ))}
        </fieldset>
        {error ? (
          <div className={styles.error} role="alert">
            <p>{error}</p>
            <Button variant="secondary" onClick={() => void generate()}>
              Try again
            </Button>
          </div>
        ) : link ? (
          <div className={styles.linkSection}>
            <label className={styles.label} htmlFor={`share-link-${resumeId}`}>
              Share link
            </label>
            <div className={styles.linkRow}>
              <Link2 className={styles.linkIcon} size={17} aria-hidden="true" />
              <input
                id={`share-link-${resumeId}`}
                ref={input}
                className={styles.link}
                type="text"
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
                spellCheck={false}
              />
              <Button className={styles.copyButton} onClick={() => void copy()}>
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            <p className={styles.copyStatus} data-copied={copied && !copyError} role="status">
                {copyError
                  ? 'Copy the selected link manually.'
                  : copied
                    ? 'Link copied. Ready to share.'
                    : 'Ready to share.'}
            </p>
          </div>
        ) : (
          <div className={styles.generating}>
            <Spinner size={22} label="Creating share link…" />
          </div>
        )}
        <div className={styles.shareNote}>
          <Info size={16} aria-hidden="true" />
          <p>Anyone with the link can access this snapshot. Later edits won’t update it.</p>
        </div>
      </div>
    </Modal>
  )
}
