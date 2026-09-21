import { Download, Eye } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from './ExportButton.module.css'

interface ExportButtonProps {
  onExport: () => void
  onPreview: () => void
  previewLoading?: boolean
  disabled?: boolean
}

export function ExportButton({
  onExport,
  onPreview,
  previewLoading,
  disabled,
}: ExportButtonProps) {
  return (
    <div className={styles.actions} data-editor-tour="export">
      <Button
        variant="secondary"
        onClick={onPreview}
        disabled={disabled}
        loading={previewLoading}
        aria-label="Preview resume as PDF"
        className={styles.previewButton}
      >
        <Eye size={15} aria-hidden="true" />
        <span className={styles.previewLabel}>Preview</span>
      </Button>
      <Button
        variant="primary"
        onClick={onExport}
        disabled={disabled}
        aria-label="Export resume as PDF"
      >
        <Download size={15} aria-hidden="true" />
        {/* Drops to just "Export" on phones so the toolbar's right group fits.
            The full intent stays on the button's aria-label. */}
        Export<span className={styles.pdfSuffix}>&nbsp;PDF</span>
      </Button>
    </div>
  )
}
