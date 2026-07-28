import type { ReactNode } from 'react'
import { Tooltip as AntTooltip } from 'antd'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: TooltipPosition
  className?: string
}

export function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
  return (
    <AntTooltip title={content} placement={position} className={className}>
      {children}
    </AntTooltip>
  )
}
