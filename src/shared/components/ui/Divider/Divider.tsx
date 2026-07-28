import { Divider as AntDivider } from 'antd'
import { clsx } from 'clsx'
import styles from './Divider.module.css'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <AntDivider
      orientation={orientation}
      className={clsx(orientation === 'vertical' && styles.vertical, className)}
      {...({ 'aria-orientation': orientation } as Record<string, unknown>)}
    />
  )
}
