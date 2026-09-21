import { create } from 'zustand'
import type { SectionType, ResumeSnapshot } from '@/shared/types/resume.types'
import type { StyleRole } from '@/shared/types/style.types'

const MAX_UNDO_STACK = 100
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.0
const ZOOM_STEP = 0.1

/** The element the style inspector is pointed at. */
export interface StyleTarget {
  /** Stable style key from the layout tree — see engine/style.roles.ts. */
  key: string
  /** The text style it inherits from, when it is a text element. */
  role: StyleRole | null
  label: string
}

interface EditorState {
  selectedSectionId: string | null
  selectedSectionType: SectionType | null
  /** The specific entry (e.g. one experience item) selected on canvas, if any — distinct from selectedSectionId, which targets a whole section-type block. */
  selectedEntryId: string | null
  zoomLevel: number
  activePage: number
  /** Independent of section/entry selection: styling an element should not
   * disturb which section's content form is open, and vice versa. */
  styleTarget: StyleTarget | null
  /** styleKey of the element open for inline editing, if any. The canvas reads
   * it to stand down its own ring while the editor draws one. */
  editingKey: string | null
  undoStack: ResumeSnapshot[]
  redoStack: ResumeSnapshot[]
  personalInfoOpenRequest: number
}

interface EditorActions {
  selectSection(id: string, type: SectionType): void
  selectEntry(entryId: string, type: SectionType): void
  clearSelection(): void
  selectStyleTarget(target: StyleTarget): void
  clearStyleTarget(): void
  setEditingKey(key: string | null): void
  openPersonalInfo(): void
  setZoom(level: number): void
  zoomIn(): void
  zoomOut(): void
  resetZoom(): void
  setActivePage(page: number): void
  pushUndoSnapshot(snapshot: ResumeSnapshot): void
  undo(): ResumeSnapshot | null
  redo(currentSnapshot: ResumeSnapshot): ResumeSnapshot | null
  clearHistory(): void
}

type EditorStore = EditorState & EditorActions

const clampZoom = (level: number) =>
  Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level)) * 10) / 10

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  selectedSectionId: null,
  selectedSectionType: null,
  selectedEntryId: null,
  zoomLevel: 1.0,
  activePage: 0,
  styleTarget: null,
  editingKey: null,
  undoStack: [],
  redoStack: [],
  personalInfoOpenRequest: 0,

  // ─── Selection ──────────────────────────────────────────────────────────────
  selectSection(id, type) {
    set({ selectedSectionId: id, selectedSectionType: type, selectedEntryId: null })
  },

  selectEntry(entryId, type) {
    set({ selectedSectionId: null, selectedSectionType: type, selectedEntryId: entryId })
  },

  clearSelection() {
    set({ selectedSectionId: null, selectedSectionType: null, selectedEntryId: null, styleTarget: null, editingKey: null })
  },

  selectStyleTarget(target) {
    set({ styleTarget: target })
  },

  clearStyleTarget() {
    set({ styleTarget: null })
  },

  setEditingKey(key) {
    set({ editingKey: key })
  },

  openPersonalInfo() {
    set((state) => ({
      selectedSectionId: null,
      selectedSectionType: null,
      selectedEntryId: null,
      personalInfoOpenRequest: state.personalInfoOpenRequest + 1,
    }))
  },

  // ─── Zoom ───────────────────────────────────────────────────────────────────
  setZoom(level) {
    set({ zoomLevel: clampZoom(level) })
  },

  zoomIn() {
    set((s) => ({ zoomLevel: clampZoom(s.zoomLevel + ZOOM_STEP) }))
  },

  zoomOut() {
    set((s) => ({ zoomLevel: clampZoom(s.zoomLevel - ZOOM_STEP) }))
  },

  resetZoom() {
    set({ zoomLevel: 1.0 })
  },

  // ─── Page ───────────────────────────────────────────────────────────────────
  setActivePage(page) {
    set({ activePage: page })
  },

  // ─── Undo / Redo ────────────────────────────────────────────────────────────
  pushUndoSnapshot(snapshot) {
    set((s) => {
      const stack = [snapshot, ...s.undoStack].slice(0, MAX_UNDO_STACK)
      return { undoStack: stack, redoStack: [] }
    })
  },

  undo() {
    const { undoStack } = get()
    if (undoStack.length === 0) return null
    const [snapshot, ...rest] = undoStack
    set({ undoStack: rest })
    return snapshot
  },

  redo(currentSnapshot) {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const [snapshot, ...rest] = redoStack
    set((s) => ({ redoStack: rest, undoStack: [currentSnapshot, ...s.undoStack] }))
    return snapshot
  },

  clearHistory() {
    set({ undoStack: [], redoStack: [] })
  },
}))
