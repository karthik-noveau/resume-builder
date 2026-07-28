import { Empty } from 'antd'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Empty
      className={styles.root}
      image={
        icon ? (
          <div className={styles.icon} aria-hidden="true">
            {icon}
          </div>
        ) : (
          Empty.PRESENTED_IMAGE_SIMPLE
        )
      }
      description={
        <>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </>
      }
    >
      {action && <div className={styles.action}>{action}</div>}
    </Empty>
  )
}
