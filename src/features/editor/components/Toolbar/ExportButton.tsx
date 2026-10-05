import { FileSearch } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from './ExportButton.module.css'

interface ExportButtonProps {
  onPreview: () => void
  previewLoading?: boolean
  disabled?: boolean
}

export function ExportButton({
  onPreview,
  previewLoading,
  disabled,
}: ExportButtonProps) {
  return (
    <div className={styles.actions} data-editor-tour="export">
      <Button
        variant="primary"
        onClick={onPreview}
        disabled={disabled}
        loading={previewLoading}
        aria-label="Preview & export"
      >
        <FileSearch size={15} aria-hidden="true" />
        <span>Preview<span className={styles.exportLabel}> &amp; export</span></span>
      </Button>
    </div>
  )
}
