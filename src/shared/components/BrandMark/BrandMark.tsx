import { clsx } from 'clsx'
import styles from './BrandMark.module.css'

interface BrandMarkProps {
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: styles.sm,
  md: styles.md,
}

export function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  return (
    <span className={clsx(styles.root, SIZE_CLASSES[size], className)} aria-hidden="true">
      <img src="/resume-studio-mark.svg?v=4" width="40" height="40" alt="" className={styles.icon} draggable={false} />
    </span>
  )
}

export function BrandLogo() {
  return (
    <span className={styles.logo}>
      <BrandMark size="md" />
      <span className={styles.wordmark}>
        <span className={styles.wordmarkResume}>Resume</span>{' '}
        <span className={styles.wordmarkStudio}>Studio</span>
      </span>
    </span>
  )
}
