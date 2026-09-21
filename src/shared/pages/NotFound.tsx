import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { Seo } from '@/shared/components/Seo/Seo'
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div className={styles.root}>
      <Seo
        title="Page not found"
        description="The page you're looking for doesn't exist."
        noindex
      />
      <div
        className={styles.blobTop}
        aria-hidden="true"
      />
      <div
        className={styles.blobBottom}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <p className={clsx(styles.code, 'bg-gradient-brand')}>
          404
        </p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Link
          to="/app"
          className={clsx(styles.cta, 'bg-gradient-brand')}
        >
          Go to Dashboard
          <span className={styles.ctaIconWrap}>
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
