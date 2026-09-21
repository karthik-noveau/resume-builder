import { Drawer as AntDrawer } from 'antd'
import type { DrawerProps } from './Drawer.types'
import { clsx } from 'clsx'
import styles from './Drawer.module.css'

export function Drawer({
  isOpen,
  onClose,
  position = 'right',
  title,
  children,
  width = '320px',
  flush = false,
}: DrawerProps) {
  return (
    <AntDrawer
      open={isOpen}
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
