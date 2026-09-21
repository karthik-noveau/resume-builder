import type { ReactNode } from 'react'

export type DrawerPosition = 'left' | 'right'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: DrawerPosition
  title?: string
  children: ReactNode
  width?: string
  flush?: boolean
}
