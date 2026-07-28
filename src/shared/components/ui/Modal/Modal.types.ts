import type { ReactNode } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** @default 'md' — maps to max-w-lg (512px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}
