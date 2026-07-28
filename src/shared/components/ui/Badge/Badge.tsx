import { Tag } from 'antd'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: styles.default,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  info: styles.info,
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <Tag bordered className={clsx(styles.root, variantClasses[variant], className)}>
      {children}
    </Tag>
  )
}
