import { Sparkles } from 'lucide-react'
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

const ICON_SIZES: Record<NonNullable<BrandMarkProps['size']>, number> = {
  sm: 15,
  md: 18,
}

export function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  return (
    <span className={clsx(styles.root, 'bg-gradient-brand', SIZE_CLASSES[size], className)}>
      <Sparkles size={ICON_SIZES[size]} className={styles.icon} aria-hidden="true" />
    </span>
  )
}
