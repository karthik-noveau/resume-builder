import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { clsx } from 'clsx'
import { ArrowRight } from 'lucide-react'
import styles from './PillCta.module.css'

interface PillCtaProps {
  to: string
  children: ReactNode
  className?: string
  /** Theme-aware primary action; white for an inverse treatment. */
  variant?: 'brand' | 'inverted'
}

export function PillCta({ to, children, className, variant = 'brand' }: PillCtaProps) {
  const isBrand = variant === 'brand'
  return (
    <Link
      to={to}
      className={clsx(styles.root, isBrand ? styles.brand : styles.inverted, className)}
    >
      {children}
      <span
        className={clsx(
          styles.iconCircle,
          isBrand ? styles.iconCircleBrand : styles.iconCircleInverted
        )}
      >
        <ArrowRight size={17} aria-hidden="true" />
      </span>
    </Link>
  )
}
