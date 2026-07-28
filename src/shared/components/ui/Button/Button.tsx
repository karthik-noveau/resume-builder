import { Button as AntButton } from 'antd'
import { clsx } from 'clsx'
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types'
import styles from './Button.module.css'

const antTypeByVariant: Record<ButtonVariant, 'primary' | 'default' | 'text'> = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'text',
  danger: 'primary',
}

const antSizeBySize: Record<ButtonSize, 'small' | 'middle' | 'large'> = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <AntButton
      htmlType={type}
      type={antTypeByVariant[variant]}
      danger={variant === 'danger'}
      size={antSizeBySize[size]}
      loading={loading}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onClick={isDisabled ? undefined : onClick}
      className={clsx(styles.root, className)}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </AntButton>
  )
}
