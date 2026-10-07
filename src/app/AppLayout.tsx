import { Outlet } from 'react-router'
import styles from './AppLayout.module.css'
import { SaveConflictDialog } from '@/features/editor/components/SaveConflictDialog'

export function AppLayout() {
  return (
    <div className={styles.root}>
      <Outlet />
      <SaveConflictDialog />
    </div>
  )
}
