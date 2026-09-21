import { Link } from 'react-router'
import { Button } from '@/shared/components/ui/Button/Button'
import { Seo } from '@/shared/components/Seo/Seo'
import styles from '@/shared/components/errors/RootErrorBoundary.module.css'

export function ResumeLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className={styles.root}>
      <Seo title="Unable to open resume" description="Try opening your resume again." noindex />
      <div className={styles.card} role="alert">
        <h1 className={styles.title}>We couldn’t open this resume.</h1>
        <p className={styles.description}>
          Your browser may be blocking storage, or the saved file couldn’t be read. Try again, or
          return to your workspace. Keep this tab open if you have unsaved changes.
        </p>
        <Button onClick={onRetry}>Try again</Button>
        <Link to="/app">Back to My Resumes</Link>
      </div>
    </main>
  )
}
