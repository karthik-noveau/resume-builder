import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import type { ExportStatus } from '@/shared/types/export.types'
import styles from './ExportProgress.module.css'

interface ExportProgressProps {
  status: ExportStatus
}

export function ExportProgress({ status }: ExportProgressProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'preparing': return 'Preparing your resume...'
      case 'rendering': return 'Rendering layout...'
      case 'generating': return 'Generating PDF...'
      case 'downloading': return 'Downloading...'
      case 'completed': return 'Export complete!'
      default: return 'Starting export...'
    }
  }

  return (
    <div className={styles.root}>
      <Spinner size={32} />
      <p className={styles.message}>
        {getStatusMessage()}
      </p>
    </div>
  )
}
