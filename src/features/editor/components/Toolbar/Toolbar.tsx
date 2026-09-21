import { Link } from 'react-router'
import { ArrowLeft, CircleHelp, ListChecks } from 'lucide-react'
import { clsx } from 'clsx'
import { UndoRedoButtons } from './UndoRedoButtons'
import { ZoomControls } from './ZoomControls'
import { ExportButton } from './ExportButton'
import { ResetButton } from './ResetButton'
import type { ResetResumeOptions } from '@/shared/stores/resume.store'
import { Divider } from '@/shared/components/ui/Divider/Divider'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { AutosaveIndicator } from '../AutosaveIndicator'
import { ResumeTitle } from '../ResumeTitle'
import styles from './Toolbar.module.css'
import mobile from '@/shared/styles/mobileEditor.module.css'

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
  onPreview: () => void
  previewLoading?: boolean
  exportDisabled?: boolean
  onReset: (options: ResetResumeOptions) => void
  onStartTour: () => void
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
  onPreview,
  previewLoading,
  exportDisabled,
  onReset,
  onStartTour,
}: ToolbarProps) {
  return (
    <div className={clsx(styles.root, mobile.controls)}>
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

        <ResumeTitle title={resumeTitle} />

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
        <Divider orientation="vertical" className={styles.dividerTall} />
        <ResetButton onReset={onReset} />
      </div>

      {/* Right: guided setup + export */}
      <div className={styles.rightGroup}>
        <button
          type="button"
          onClick={onStartTour}
          aria-label="Quick tour"
          title="Quick tour"
          data-editor-tour="replay"
          className={styles.tourButton}
        >
          <CircleHelp size={17} aria-hidden="true" />
          <span className={styles.tourLabel}>Quick tour</span>
        </button>
        <Link
          to={`/editor/${resumeId}/guided`}
          aria-label="Step by Step Edit"
          className={styles.guidedLink}
        >
          <ListChecks size={16} aria-hidden="true" />
          <span className={styles.guidedLinkLabel}>Step by Step Edit</span>
        </Link>
        <Divider orientation="vertical" className={clsx(styles.dividerDesktop, styles.dividerTall)} />
        <ExportButton
          onExport={onExport}
          onPreview={onPreview}
          previewLoading={previewLoading}
          disabled={exportDisabled}
        />
      </div>
    </div>
  )
}
