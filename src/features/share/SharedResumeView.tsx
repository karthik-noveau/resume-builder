import { lazy, Suspense, useEffect, useState } from 'react'
import { decodeShareLink, imageData } from './share.service'
import { exportService, type GeneratedPdf } from '@/features/export/services/export.service'
import type { ImageAsset } from '@/shared/types/storage.types'
import { Button } from '@/shared/components/ui/Button/Button'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { Seo } from '@/shared/components/Seo/Seo'
import styles from './Share.module.css'

const PdfPreview = lazy(() =>
  import('@/features/export/components/ExportModal/PdfPreview').then((m) => ({
    default: m.PdfPreview,
  }))
)

/** Viewing a link never writes a resume or photo to the recipient's database. */
export function SharedResumeView({ hash }: { hash: string }) {
  const [pdf, setPdf] = useState<GeneratedPdf>()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('Shared resume')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const retry = () => setAttempt((value) => value + 1)
  useEffect(() => {
    let active = true
    let previewUrl: string | undefined
    setError('')
    setPdf(undefined)
    setUrl('')
    void (async () => {
      const payload = await decodeShareLink(hash)
      const images = new Map<string, ImageAsset>()
      if (payload.image && payload.resume.personalInfo.profileImage) {
        const data = imageData(payload.image)
        const id = payload.resume.personalInfo.profileImage
        images.set(id, {
          ...payload.image,
          id,
          resumeId: payload.resume.id,
          data,
          sizeBytes: data.length,
          createdAt: payload.resume.createdAt,
        })
      }
      const generated = await exportService.generatePdf(payload.resume, images)
      if (!active) return
      previewUrl = exportService.createPreviewUrl(generated)
      setPdf(generated)
      setUrl(previewUrl)
      setName(payload.resume.personalInfo.fullName || payload.resume.title || 'Shared resume')
    })().catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Couldn’t open this resume.')
    })
    return () => {
      active = false
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [hash, attempt])
  return (
    <main className={styles.viewer}>
      <Seo title="Shared resume" description="Read-only resume preview." noindex />
      <header className={styles.viewerHeader}>
        <div>
          <h1>{name}</h1>
          <p>Read-only snapshot</p>
        </div>
        <Button
          disabled={!pdf}
          onClick={() => {
            if (pdf) exportService.downloadPdf(pdf)
          }}
        >
          Download PDF
        </Button>
      </header>
      {error ? (
        <div className={styles.importCard}>
          <p role="alert">{error}</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      ) : url ? (
        <div className={styles.viewerPreview}>
          <Suspense fallback={<Spinner label="Loading preview…" />}>
            <PdfPreview key={url} url={url} onRetry={retry} />
          </Suspense>
        </div>
      ) : (
        <Spinner label="Opening shared resume…" />
      )}
    </main>
  )
}
