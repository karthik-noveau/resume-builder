import type { SectionType } from './resume.types'

export interface CanvasState {
  zoomLevel: number
  selectedSectionId: string | null
  selectedSectionType: SectionType | null
  selectedElementId: string | null
  editMode: boolean
  activePage: number
  isDragging: boolean
}

export interface SelectionTarget {
  sectionId: string
  sectionType: SectionType
  elementId?: string
}
