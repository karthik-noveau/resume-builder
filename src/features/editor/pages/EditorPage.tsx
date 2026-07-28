import { useParams } from 'react-router'
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
import styles from './EditorPage.module.css'

export function EditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>()

  const { activeResume, isLoading } = useActiveResume(resumeId)
  const isSaving = useResumeStore((s) => s.isSaving)
  const isDirty = useResumeStore((s) => s.isDirty)
  const saveError = useResumeStore((s) => s.error)
  const addSection = useResumeStore((s) => s.addSection)
  const reorderSectionBlocks = useResumeStore((s) => s.reorderSectionBlocks)
  const toggleSectionTypeVisibility = useResumeStore((s) => s.toggleSectionTypeVisibility)
  const saveActiveResume = useResumeStore((s) => s.saveActiveResume)
  const deleteSection = useResumeStore((s) => s.deleteSection)

  const selectSection = useEditorStore((s) => s.selectSection)

  const { status: exportStatus, error: exportError, exportToPdf, isExporting } = useExport()

  const layoutTree = useResumeLayoutTree(activeResume)

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

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => { void saveActiveResume() },
    onEscape: () => { clearSelection() },
    onDelete: selectedEntryId && selectedSectionType
      ? () => {
          deleteSection(selectedSectionType, selectedEntryId)
          clearSelection()
        }
      : undefined,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
  })

  if (isLoading || !activeResume) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} label="Loading resume…" />
      </div>
    )
  }

  const handleSelectSection = (type: SectionType) => {
    selectSection(type, type)
  }

  const handleToggleVisibility = (type: SectionType) => {
    toggleSectionTypeVisibility(type)
  }

  const handleExport = () => {
    if (activeResume) {
      void exportToPdf(activeResume)
    }
  }

  return (
    <>
      <EditorLayout
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
            exportDisabled={isExporting}
          />
        }
        sidebar={
          <Sidebar
            resume={activeResume}
            selectedSectionType={selectedSectionType}
            onSelectSection={handleSelectSection}
            onAddSection={addSection}
            onReorderBlocks={reorderSectionBlocks}
            onToggleVisibility={handleToggleVisibility}
          />
        }
        canvas={
          <Canvas
            layoutTree={layoutTree}
            zoomLevel={zoomLevel}
            pageSize={activeResume.settings.pageSize}
            selectedSectionId={selectedSectionId}
            selectedEntryId={selectedEntryId}
            onSectionClick={handleSectionClick}
            onEntryClick={handleEntryClick}
            onCanvasClick={handleCanvasClick}
          />
        }
        propertiesPanel={
          <PropertiesPanel
            resume={activeResume}
            selectedSectionType={selectedSectionType}
            onClearSelection={clearSelection}
          />
        }
      />

      <ExportModal
        isOpen={exportStatus !== 'idle'}
        onClose={() => {}} // Reset state is handled by the hook after completion
        status={exportStatus}
        error={exportError}
        onRetry={handleExport}
      />
    </>
  )
}


export default EditorPage
