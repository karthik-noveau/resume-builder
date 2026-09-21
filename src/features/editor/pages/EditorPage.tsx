import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { FilePenLine } from 'lucide-react'
import { EditorLayout } from '@/shared/components/layout/EditorLayout'
import { Toolbar } from '../components/Toolbar/Toolbar'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Canvas } from '../components/Canvas/Canvas'
import { PropertiesPanel } from '../components/PropertiesPanel/PropertiesPanel'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { useActiveResume } from '../hooks/useActiveResume'
import { useResumeLayoutTree } from '../hooks/useResumeLayoutTree'
import { useAutosave } from '../hooks/useAutosave'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useZoom } from '../hooks/useZoom'
import { useCanvasSelection } from '../hooks/useCanvasSelection'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useExport } from '@/features/export/hooks/useExport'
import { ExportModal } from '@/features/export/components/ExportModal/ExportModal'
import type { SectionType } from '@/shared/types/resume.types'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { Seo } from '@/shared/components/Seo/Seo'
import { Button } from '@/shared/components/ui/Button/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState/EmptyState'
import { hasResumeContent } from '@/features/resume/utils/resumeContent'
import { useEditorTour } from '../hooks/useEditorTour'
import { EditorTour } from '../components/EditorTour/EditorTour'
import styles from './EditorPage.module.css'
import { ResumeLoadError } from '../components/ResumeLoadError'
import { prepareExport } from '../utils/prepareExport'

export function EditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const openedResumeId = useRef<string | null>(null)
  const [inspectorRequest, setInspectorRequest] = useState(0)
  const personalInfoRequest = useEditorStore((s) => s.personalInfoOpenRequest)

  const { activeResume, isLoading, loadError, retry } = useActiveResume(resumeId)
  const hasContent = activeResume !== null && hasResumeContent(activeResume)
  useEffect(() => {
    if (!isLoading && activeResume?.id === resumeId && hasContent) {
      openedResumeId.current = resumeId ?? null
    }
  }, [activeResume?.id, resumeId, isLoading, hasContent])
  const isSaving = useResumeStore((s) => s.isSaving)
  const isDirty = useResumeStore((s) => s.isDirty)
  const saveError = useResumeStore((s) => s.error)
  const toggleSectionTypeVisibility = useResumeStore((s) => s.toggleSectionTypeVisibility)
  const saveActiveResume = useResumeStore((s) => s.saveActiveResume)
  const deleteSection = useResumeStore((s) => s.deleteSection)
  const reorderSectionBlocks = useResumeStore((s) => s.reorderSectionBlocks)
  const resetResume = useResumeStore((s) => s.resetResume)

  const selectSection = useEditorStore((s) => s.selectSection)

  const {
    status: exportStatus,
    error: exportError,
    mode: exportMode,
    previewUrl,
    exportToPdf,
    previewPdf,
    closeExport,
    isExporting,
  } = useExport()

  const layoutTree = useResumeLayoutTree(activeResume)
  const tour = useEditorTour(
    !isLoading &&
      activeResume?.id === resumeId &&
      hasContent &&
      layoutTree !== null &&
      exportStatus === 'idle'
  )

  useAutosave()
  const { handleUndo, handleRedo, canUndo, canRedo } = useUndoRedo()
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = useZoom()
  const {
    selectedSectionId,
    selectedEntryId,
    selectedSectionType,
    handleSectionClick,
    handleEntryClick,
    handleCanvasClick,
    clearSelection,
  } = useCanvasSelection()

  // Arrow keys move whatever is selected on the canvas.

  useKeyboardShortcuts({
    enabled: !tour.isOpen,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => {
      void saveActiveResume()
    },
    onEscape: () => {
      clearSelection()
    },
    onDelete:
      selectedEntryId && selectedSectionType
        ? () => {
            deleteSection(selectedSectionType, selectedEntryId)
            clearSelection()
          }
        : undefined,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
  })

  if (!isLoading && loadError && (!activeResume || activeResume.id !== resumeId)) {
    return <ResumeLoadError onRetry={retry} />
  }
  if (isLoading || !activeResume || activeResume.id !== resumeId) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} label="Loading resume…" />
      </div>
    )
  }

  // New/reopened blank drafts belong in setup. If content was cleared while
  // editing, keep the toolbar and undo history instead of showing a blank page.
  if (!hasContent && openedResumeId.current !== activeResume.id) {
    return <Navigate to={`/editor/${activeResume.id}/guided`} replace />
  }

  const continueSetup = async () => {
    await saveActiveResume()
    if (!useResumeStore.getState().error) void navigate(`/editor/${activeResume.id}/guided`)
  }

  const handleSelectSection = (type: SectionType) => {
    selectSection(type, type)
    setInspectorRequest((value) => value + 1)
  }

  const handleToggleVisibility = (type: SectionType) => {
    toggleSectionTypeVisibility(type)
  }

  const handleExport = () => {
    void prepareExport().then((latest) => {
      if (latest?.id === resumeId && hasResumeContent(latest)) void exportToPdf(latest)
    })
  }

  const handlePreview = () => {
    void prepareExport().then((latest) => {
      if (latest?.id === resumeId && hasResumeContent(latest)) void previewPdf(latest)
    })
  }

  return (
    <>
      {/* Titled with the resume so browser tabs and history stay distinguishable. */}
      <Seo title={`Editing ${activeResume.title}`} description="Resume editor." noindex />
      <EditorLayout
        propertiesRequest={`${inspectorRequest}:${personalInfoRequest}`}
        onPropertiesOpened={() => {
          // The drawer focuses its container on opening. Restore the requested
          // field once that focus transfer and the opening transition finish.
          const editor = useEditorStore.getState()
          if (editor.personalInfoFocusTarget) editor.openPersonalInfo(editor.personalInfoFocusTarget)
        }}
        tourOpen={tour.isOpen}
        toolbar={
          <Toolbar
            resumeId={activeResume.id}
            resumeTitle={activeResume.title}
            isSaving={isSaving}
            isDirty={isDirty}
            error={saveError}
            canUndo={canUndo}
            canRedo={canRedo}
            zoomLevel={zoomLevel}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onExport={handleExport}
            onPreview={handlePreview}
            previewLoading={isExporting && exportMode === 'preview'}
            exportDisabled={isExporting || !hasContent}
            onReset={resetResume}
            onStartTour={tour.start}
          />
        }
        sidebar={
          <Sidebar
            tourStep={tour.step}
            resume={activeResume}
            layoutTree={layoutTree}
            selectedSectionType={selectedSectionType}
            onSelectSection={handleSelectSection}
            onReorderBlocks={reorderSectionBlocks}
            onToggleVisibility={handleToggleVisibility}
          />
        }
        canvas={
          hasContent ? (
            <Canvas
              layoutTree={layoutTree}
              zoomLevel={zoomLevel}
              pageSize={activeResume.settings.pageSize}
              selectedSectionId={selectedSectionId}
              selectedEntryId={selectedEntryId}
              onSectionClick={(id, type) => {
                handleSectionClick(id, type)
                setInspectorRequest((value) => value + 1)
              }}
              onEntryClick={(id, type) => {
                handleEntryClick(id, type)
                setInspectorRequest((value) => value + 1)
              }}
              onCanvasClick={handleCanvasClick}
            />
          ) : (
            <EmptyState
              icon={<FilePenLine size={28} aria-hidden="true" />}
              title="Add content to your resume"
              description="Your resume is empty. Continue guided setup to add your details, or undo your last change."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    void continueSetup()
                  }}
                >
                  Continue guided setup
                </Button>
              }
            />
          )
        }
        propertiesPanel={
          <PropertiesPanel
            tourStep={tour.step}
            resume={activeResume}
            layoutTree={layoutTree}
            selectedSectionType={selectedSectionType}
            onClearSelection={clearSelection}
          />
        }
      />

      {tour.isOpen && (
        <EditorTour current={tour.current} onChange={tour.goToStep} onClose={tour.close} />
      )}

      <ExportModal
        isOpen={exportStatus !== 'idle'}
        onClose={closeExport}
        status={exportStatus}
        error={exportError}
        onRetry={exportMode === 'preview' ? handlePreview : handleExport}
        mode={exportMode}
        previewUrl={previewUrl}
      />
    </>
  )
}

export default EditorPage
