import { Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from './ExportButton.module.css'

interface ExportButtonProps {
  onExport: () => void
  disabled?: boolean
}

export function ExportButton({ onExport, disabled }: ExportButtonProps) {
  return (
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
  )
}
