import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const request = useRef(0)
  const input = useRef<HTMLTextAreaElement>(null)
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
      const url = await createShareLink(resume)
      if (generation === request.current) setLink(url)
    } catch (cause) {
      if (generation === request.current)
        setError(
          cause instanceof Error ? cause.message : 'Couldn’t create a share link. Try again.'
        )
    }
  }, [cardResume, resumeId])
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
      setCopyError(true)
      input.current?.focus()
      input.current?.select()
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Share resume" className={styles.modal}>
      <div className={styles.shareContent}>
        <div className={styles.intro}>
          <span className={styles.icon}>
            <Link2 size={22} aria-hidden="true" />
          </span>
          <div>
            <h3>Your resume, in a link</h3>
            <p>Includes all resume content, design settings and your profile photo.</p>
          </div>
        </div>
        <p className={styles.description}>
          Anyone with this link can open an editable copy. Later changes to your resume won’t change
          this snapshot.
        </p>
        {error ? (
          <div className={styles.error} role="alert">
            <p>{error}</p>
            <Button variant="secondary" onClick={() => void generate()}>
              Try again
            </Button>
          </div>
        ) : link ? (
          <>
            <label className={styles.label} htmlFor={`share-link-${resumeId}`}>
              Share link
            </label>
            <textarea
              id={`share-link-${resumeId}`}
              ref={input}
              className={styles.link}
              rows={3}
              readOnly
              value={link}
              onFocus={(event) => event.target.select()}
              spellCheck={false}
            />
            <div className={styles.footer}>
              <p role="status">
                {copyError
                  ? 'Copy the selected link manually.'
                  : copied
                    ? 'Link copied. Ready to share.'
                    : 'Opening the link loads the included resume.'}
              </p>
              <Button onClick={() => void copy()}>
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.generating}>
            <Spinner size={22} label="Creating share link…" />
          </div>
        )}
      </div>
    </Modal>
  )
}
