import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Link2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { Seo } from '@/shared/components/Seo/Seo'
import { importSharedResume } from './share.service'
import styles from './Share.module.css'

export function SharedResumePage() {
  const { hash } = useLocation()
  return <SharedResumeImport key={hash} hash={hash} />
}

function SharedResumeImport({ hash }: { hash: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  // Strict Mode replays effects: reuse the import so one visit creates one copy.
  const pending = useRef<Promise<string> | null>(null)
  useEffect(() => {
    let active = true
    pending.current ??= importSharedResume(hash)
    void pending.current.then(
      (id) => {
        if (active) void navigate(`/editor/${id}`, { replace: true })
      },
      (cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Couldn’t open this share link.')
      }
    )
    return () => {
      active = false
    }
  }, [hash, navigate, attempt])

  return (
    <>
      <Seo title="Shared resume" description="Open a shared Resume Studio resume." noindex />
      <main className={styles.importPage}>
        <div className={styles.importCard}>
          {error ? (
            <>
              <span className={styles.icon}>
                <Link2 size={24} aria-hidden="true" />
              </span>
              <h1>We couldn’t open this link</h1>
              <p role="alert">{error}</p>
              <div className={styles.importActions}>
                <Link to="/app">My resumes</Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    pending.current = null
                    setError('')
                    setAttempt((value) => value + 1)
                  }}
                >
                  Try again
                </Button>
              </div>
            </>
          ) : (
            <>
              <Spinner size={28} label="Opening shared resume…" />
              <p>Loading the content and design from your link.</p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
