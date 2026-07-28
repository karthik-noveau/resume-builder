import { Link } from 'react-router'
import { ArrowLeft, ListChecks } from 'lucide-react'
import { clsx } from 'clsx'
import { UndoRedoButtons } from './UndoRedoButtons'
import { ZoomControls } from './ZoomControls'
import { ExportButton } from './ExportButton'
import { Divider } from '@/shared/components/ui/Divider/Divider'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { AutosaveIndicator } from '../AutosaveIndicator'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  resumeId: string
  resumeTitle: string
  isSaving: boolean
  isDirty: boolean
  error?: string | null
  canUndo: boolean
  canRedo: boolean
  zoomLevel: number
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onExport: () => void
  exportDisabled?: boolean
}

export function Toolbar({
  resumeId,
  resumeTitle,
  isSaving,
  isDirty,
  error,
  canUndo,
  canRedo,
  zoomLevel,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onExport,
  exportDisabled,
}: ToolbarProps) {
  return (
    <div className={styles.root}>
      {/* Left: brand + back + title + autosave */}
      <div className={styles.leftGroup}>
        <Link to="/" aria-label="Resume Studio home" className={styles.brandLink}>
          <BrandMark size="sm" />
        </Link>
        <Divider orientation="vertical" className={clsx(styles.dividerDesktop, styles.dividerTall)} />
        <Link
          to="/app"
          aria-label="Back to dashboard"
          className={styles.backLink}
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>

        <h1
          className={styles.title}
          title={resumeTitle}
        >
          {resumeTitle || 'Untitled Resume'}
        </h1>

        <div className={styles.autosaveWrap}>
          <AutosaveIndicator isSaving={isSaving} isDirty={isDirty} error={error} />
        </div>
      </div>

      {/* Center: undo/redo + divider + zoom */}
      <div className={styles.centerGroup}>
        <UndoRedoButtons
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
        <div className={styles.zoomWrap}>
          <Divider orientation="vertical" className={styles.dividerTall} />
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
          />
        </div>
      </div>

      {/* Right: guided setup + export */}
      <div className={styles.rightGroup}>
        <Link
          to={`/editor/${resumeId}/guided`}
          aria-label="Guided setup"
          className={styles.guidedLink}
        >
          <ListChecks size={16} aria-hidden="true" />
          <span className={styles.guidedLinkLabel}>Guided Setup</span>
        </Link>
        <Divider orientation="vertical" className={clsx(styles.dividerDesktop, styles.dividerTall)} />
        <ExportButton onExport={onExport} disabled={exportDisabled} />
      </div>
    </div>
  )
}

