import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import styles from './PageLayout.module.css'

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <main className={clsx(styles.root, className)}>
      {children}
    </main>
  )
}
