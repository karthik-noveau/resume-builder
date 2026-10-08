import { Drawer as AntDrawer } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { DrawerProps } from './Drawer.types'
import { clsx } from 'clsx'
import styles from './Drawer.module.css'
import { useSwipeToClose } from './useSwipeToClose'

export function Drawer({
  isOpen,
  onClose,
  position = 'right',
  title,
  children,
  width = '320px',
  flush = false,
  onAfterOpen,
  rootClassName,
}: DrawerProps) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useSwipeToClose(panel, isOpen, onClose)

  useEffect(() => {
    if (isOpen) return
    // Remember the trigger before the drawer's focus trap takes ownership.
    const rememberFocus = () => {
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body && !active.closest('.ant-drawer')) {
        returnFocus.current = active
      }
    }
    rememberFocus()
    document.addEventListener('focusin', rememberFocus)
    return () => document.removeEventListener('focusin', rememberFocus)
  }, [isOpen])

  useEffect(() => {
    if (isOpen || panel) return
    // Interrupted entrances can skip afterOpenChange. Wait for the actual
    // panel removal, then restore focus after the focus trap has released it.
    const frame = requestAnimationFrame(() => {
      if (document.activeElement === document.body && returnFocus.current?.isConnected) {
        returnFocus.current.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, panel])

  return (
    <AntDrawer
      panelRef={setPanel}
      open={isOpen}
      afterOpenChange={(open) => {
        if (open) onAfterOpen?.()
      }}
      onClose={onClose}
      placement={position}
      title={title}
      size={/^\d+px$/.test(width) ? Number.parseInt(width, 10) : width}
      closable={!!title}
      keyboard
      maskClosable
      destroyOnHidden
      rootClassName={clsx(styles.root, flush && styles.editorDrawer, rootClassName)}
      classNames={{ body: flush ? styles.flushBody : undefined }}
    >
      {children}
    </AntDrawer>
  )
}
