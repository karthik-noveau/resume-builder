import { Spin } from 'antd'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export function Spinner({ size = 24, className, label = 'Loading…' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={styles.root}>
      <Spin size={size >= 32 ? 'large' : size <= 16 ? 'small' : 'medium'} className={className} />
    </div>
  )
}
