import type { Resume, BaseSectionContract } from '@/shared/types/resume.types'
import type { EditRef, EntrySectionType } from '@/shared/types/layout.types'
import { useResumeStore } from '@/shared/stores/resume.store'

const ENTRY_ARRAYS: Record<EntrySectionType, keyof Resume> = {
  experience: 'experience',
  education: 'education',
  projects: 'projects',
  certifications: 'certifications',
}

function findEntry(resume: Resume, sectionType: EntrySectionType, entryId: string): BaseSectionContract | undefined {
  const entries = resume[ENTRY_ARRAYS[sectionType]] as BaseSectionContract[]
  return entries.find((e) => e.id === entryId)
}

/**
 * Reads the current, untransformed value an editRef points to — used to seed
 * inline editing so display transforms (e.g. uppercasing a name) or
 * empty-field placeholder text are never mistaken for real content.
 */
export function getEditRefValue(editRef: EditRef, resume: Resume): string {
  switch (editRef.kind) {
    case 'personal-info':
      return resume.personalInfo[editRef.field] ?? ''
    case 'summary':
      return resume.summary.content ?? ''
    case 'section-title':
      return resume.sectionTitles?.[editRef.sectionType] ?? editRef.defaultValue
    case 'custom-section-title':
      return resume.customSections.find((section) => section.id === editRef.sectionId)?.title
        ?? editRef.defaultValue
    case 'entry':
      // Whole-entry selection target, not a text leaf — no value to seed an edit with.
      return ''
    case 'entry-field': {
      const entry = findEntry(resume, editRef.sectionType, editRef.entryId)
      const value = (entry as unknown as Record<string, unknown> | undefined)?.[editRef.field]
      return typeof value === 'string' ? value : ''
    }
    case 'entry-list-item': {
      const entry = findEntry(resume, editRef.sectionType, editRef.entryId)
      const list = (entry as unknown as Record<string, unknown> | undefined)?.[editRef.field]
      if (!Array.isArray(list)) return ''
      const value: unknown = list[editRef.index]
      return typeof value === 'string' ? value : ''
    }
  }
}

/**
 * Commits an edited value back to the resume store via the same actions
 * every Properties Panel form already uses — undo/redo and autosave
 * dirty-flagging keep working unmodified.
 */
export function applyEditRefValue(editRef: EditRef, newValue: string, resume: Resume): void {
  const store = useResumeStore.getState()
  switch (editRef.kind) {
    case 'personal-info':
      store.updatePersonalInfo({ [editRef.field]: newValue })
      break
    case 'summary':
      store.updateSummary(newValue)
      break
    case 'section-title': {
      const title = newValue.trim()
      if (!title) break
      store.updateResume({
        sectionTitles: { ...resume.sectionTitles, [editRef.sectionType]: title },
      })
      break
    }
    case 'custom-section-title': {
      const title = newValue.trim()
      if (!title) break
      store.updateSection('custom', editRef.sectionId, { title })
      break
    }
    case 'entry':
      // Whole-entry selection target, not a text leaf — nothing to commit.
      break
    case 'entry-field':
      store.updateSection(editRef.sectionType, editRef.entryId, { [editRef.field]: newValue })
      break
    case 'entry-list-item': {
      const entry = findEntry(resume, editRef.sectionType, editRef.entryId)
      const current = (entry as unknown as Record<string, unknown> | undefined)?.[editRef.field]
      if (!Array.isArray(current)) return
      const list: string[] = [...(current as string[])]
      list[editRef.index] = newValue
      store.updateSection(editRef.sectionType, editRef.entryId, { [editRef.field]: list })
      break
    }
  }
}
