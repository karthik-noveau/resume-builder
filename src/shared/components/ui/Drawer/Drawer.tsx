import { Drawer as AntDrawer } from 'antd'
import { useState } from 'react'
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
}: DrawerProps) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  useSwipeToClose(panel, isOpen, onClose)

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
      rootClassName={clsx(styles.root, flush && styles.editorDrawer)}
      classNames={{ body: flush ? styles.flushBody : undefined }}
    >
      {children}
    </AntDrawer>
  )
}
