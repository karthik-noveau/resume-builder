import { useEditorStore } from '@/shared/stores/editor.store'
import type { SectionType } from '@/shared/types/resume.types'

export function useCanvasSelection() {
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId)
  const selectedSectionType = useEditorStore((s) => s.selectedSectionType)
  const selectedEntryId = useEditorStore((s) => s.selectedEntryId)
  const selectSection = useEditorStore((s) => s.selectSection)
  const selectEntry = useEditorStore((s) => s.selectEntry)
  const clearSelection = useEditorStore((s) => s.clearSelection)

  const handleSectionClick = (id: string, type: SectionType) => {
    selectSection(id, type)
  }

  const handleEntryClick = (entryId: string, type: SectionType) => {
    selectEntry(entryId, type)
  }

  const handleCanvasClick = () => {
    clearSelection()
  }

  return {
    selectedSectionId,
    selectedSectionType,
    selectedEntryId,
    handleSectionClick,
    handleEntryClick,
    handleCanvasClick,
    clearSelection,
  }
}
