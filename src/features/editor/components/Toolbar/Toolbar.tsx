import { AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { Dropdown } from 'antd'
import { RecoveryDialog } from '@/features/resume/components/RecoveryDialog'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, CircleHelp, History, ListChecks, Maximize, MoreHorizontal, Redo2, RotateCcw, Share2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { clsx } from 'clsx'
import { UndoRedoButtons } from './UndoRedoButtons'
import { ZoomControls } from './ZoomControls'
import { ExportButton } from './ExportButton'
import { ResetButton } from './ResetButton'
import { ShareButton } from '@/features/share/ShareButton'
import type { ResetResumeOptions } from '@/shared/stores/resume.store'
import { Divider } from '@/shared/components/ui/Divider/Divider'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { AutosaveIndicator } from '../AutosaveIndicator'
import { ResumeTitle } from '../ResumeTitle'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
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
  onPreview,
  previewLoading,
  exportDisabled,
  onReset,
  onStartTour,
}: ToolbarProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const isCompact = useMediaQuery('(max-width: 1023px)')
  const hasZoomControls = useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()
  const moreButton = useRef<HTMLButtonElement>(null)
  const openFromMenu = (action: () => void) => {
    setMoreOpen(false)
    // Finish the menu's click handling before a dialog captures its return target.
    requestAnimationFrame(() => {
      if (!moreButton.current?.isConnected) return
      moreButton.current.focus({ preventScroll: true })
      action()
    })
  }
  return (
    <div className={clsx(styles.root, mobile.controls)}>
      {/* Left: brand + back + title + autosave */}
      <div className={styles.leftGroup}>
        <Link to="/" aria-label="Resume Studio home" className={styles.brandLink}>
          <BrandMark size="sm" />
        </Link>
        <Divider
          orientation="vertical"
          className={clsx(styles.dividerDesktop, styles.dividerTall)}
        />
        <Link to="/app" aria-label="Back to dashboard" className={styles.backLink}>
          <BrandMark size="sm" className={styles.mobileBrand} />
          <ArrowLeft size={18} aria-hidden="true" className={styles.backIcon} />
        </Link>

        <div className={styles.documentIdentity}>
          <ResumeTitle title={resumeTitle} />

          <div className={styles.autosaveWrap}>
            <AutosaveIndicator isSaving={isSaving} isDirty={isDirty} error={error} />
          </div>
        </div>
      </div>

      {/* Center: undo/redo + divider + zoom */}
      <div className={styles.centerGroup}>
        <div className={styles.undoGroup}>
          <UndoRedoButtons canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
        </div>
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
        <div className={styles.resetWrap}>
          <ResetButton onReset={onReset} open={resetOpen} onOpenChange={setResetOpen} />
        </div>
      </div>

      <AnimatePresence>{historyOpen && <RecoveryDialog resumeId={resumeId} onClose={() => setHistoryOpen(false)} />}</AnimatePresence>
      {/* Right: guided setup + export */}
      <div className={styles.rightGroup}>
        <button
          type="button"
          className={clsx(styles.tourButton, styles.desktopAction)}
          aria-label="Version history"
          title="Version history"
          onClick={() => setHistoryOpen(true)}
        >
          <History size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onStartTour}
          aria-label="Quick tour"
          title="Quick tour"
          data-editor-tour={isCompact ? undefined : 'replay'}
          className={clsx(styles.tourButton, styles.desktopAction)}
        >
          <CircleHelp size={17} aria-hidden="true" />
          <span className={styles.tourLabel}>Quick tour</span>
        </button>
        <Link
          to={`/editor/${resumeId}/guided`}
          aria-label="Step by Step Edit"
          className={clsx(styles.guidedLink, styles.desktopAction)}
        >
          <ListChecks size={16} aria-hidden="true" />
          <span className={styles.guidedLinkLabel}>Step by Step Edit</span>
        </Link>
        <Divider
          orientation="vertical"
          className={clsx(styles.dividerDesktop, styles.dividerTall)}
        />
        <div className={styles.documentActions}>
          <div className={styles.shareAction}>
            <ShareButton resumeId={resumeId} open={shareOpen} onOpenChange={setShareOpen} />
          </div>
          <ExportButton
            onPreview={onPreview}
            previewLoading={previewLoading}
            disabled={exportDisabled}
            compact={isCompact}
          />
        </div>
      </div>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        open={isCompact && moreOpen}
        onOpenChange={setMoreOpen}
        autoFocus
        menu={{
          triggerSubMenuAction: 'click',
          items: [
            {
              key: 'share', label: 'Share resume', icon: <Share2 size={16} />,
              onClick: () => openFromMenu(() => setShareOpen(true)),
            },
            { type: 'divider' },
            {
              key: 'undo', label: 'Undo', icon: <Undo2 size={16} />, disabled: !canUndo,
              onClick: () => openFromMenu(onUndo),
            },
            {
              key: 'redo', label: 'Redo', icon: <Redo2 size={16} />, disabled: !canRedo,
              onClick: () => openFromMenu(onRedo),
            },
            hasZoomControls ? {
              key: 'zoom', label: 'Canvas zoom', icon: <ZoomIn size={16} />,
              popupClassName: styles.moreMenu,
              children: [
                { key: 'zoom-in', label: 'Zoom in', icon: <ZoomIn size={16} />, onClick: () => openFromMenu(onZoomIn) },
                { key: 'zoom-out', label: 'Zoom out', icon: <ZoomOut size={16} />, onClick: () => openFromMenu(onZoomOut) },
                { key: 'fit', label: 'Fit to window', icon: <Maximize size={16} />, onClick: () => openFromMenu(onResetZoom) },
              ],
            } : null,
            { type: 'divider' },
            {
              key: 'guided', label: 'Step-by-step edit', icon: <ListChecks size={16} />,
              onClick: () => { void navigate(`/editor/${resumeId}/guided`) },
            },
            {
              key: 'history', label: 'Version history', icon: <History size={16} />,
              onClick: () => openFromMenu(() => setHistoryOpen(true)),
            },
            {
              key: 'tour', label: 'Quick tour', icon: <CircleHelp size={16} />,
              onClick: () => openFromMenu(onStartTour),
            },
            { type: 'divider' },
            {
              key: 'reset', label: 'Reset resume', icon: <RotateCcw size={16} />,
              onClick: () => openFromMenu(() => setResetOpen(true)),
            },
          ],
          className: styles.moreMenu,
        }}
      >
        <button
          ref={moreButton}
          type="button"
          aria-label="More editor actions"
          aria-haspopup="menu"
          aria-expanded={isCompact && moreOpen}
          title="More actions"
          data-editor-tour={isCompact ? 'replay' : undefined}
          className={styles.mobileMore}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </Dropdown>
    </div>
  )
}
