import { Card as AntCard } from 'antd'
import type { CardProps } from './Card.types'
import styles from './Card.module.css'

const paddingClasses = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
}

export function Card({ children, hoverable, padding = 'md', className, ...rest }: CardProps) {
  return (
    <AntCard
      hoverable={hoverable}
      className={className}
      classNames={{ body: paddingClasses[padding] }}
      {...rest}
    >
      {children}
    </AntCard>
  )
}
