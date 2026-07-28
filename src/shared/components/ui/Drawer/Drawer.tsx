import { Drawer as AntDrawer } from 'antd'
import type { DrawerProps } from './Drawer.types'

export function Drawer({
  isOpen,
  onClose,
  position = 'right',
  title,
  children,
  width = '320px',
}: DrawerProps) {
  return (
    <AntDrawer
      open={isOpen}
      onClose={onClose}
      placement={position}
      title={title}
      size={width}
      closable={!!title}
      keyboard
      maskClosable
      destroyOnHidden
    >
      {children}
    </AntDrawer>
  )
}
