import { clsx } from 'clsx'
import styles from './Skeleton.module.css'

export type SkeletonVariant = 'text' | 'rect' | 'circle'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ variant = 'rect', width, height, className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(styles.root, styles[variant], className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  )
}
