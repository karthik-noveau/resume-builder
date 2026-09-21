import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { logger } from '@/shared/services/logger'
import { Seo } from '@/shared/components/Seo/Seo'
import styles from './RootErrorBoundary.module.css'

/** Router errors are passed as data, not thrown into a React error boundary. */
export function RouteError() {
  const error = useRouteError()
  useEffect(() => {
    logger.error('Page failed to load', error)
  }, [error])

  return (
    <main className={styles.root}>
      <Seo title="Unable to open page" description="Try loading this page again." noindex />
      <div className={styles.card}>
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Let’s get you back to work.</h1>
          <p className={styles.description}>
            This page couldn’t load. Check your connection and try again. Resumes already saved in
            this browser are kept on this device.
          </p>
        </div>
        <button className={styles.reloadButton} onClick={() => window.location.reload()}>
          Try again
        </button>
        <a href="/app">Go to My Resumes</a>
      </div>
    </main>
  )
}
