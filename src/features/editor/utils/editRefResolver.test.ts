import { describe, it, expect, beforeEach } from 'vitest'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { getEditRefValue, applyEditRefValue } from './editRefResolver'

function loadResume() {
  const resume = createSampleResume('meridian')
  useResumeStore.setState({ activeResume: resume })
  return resume
}

describe('editRefResolver', () => {
  beforeEach(() => {
    useResumeStore.setState({ activeResume: null, isDirty: false })
  })

  describe('getEditRefValue', () => {
    it('reads the raw personal-info field, ignoring any display transform', () => {
      const resume = loadResume()
      expect(getEditRefValue({ kind: 'personal-info', field: 'fullName' }, resume)).toBe(resume.personalInfo.fullName)
    })

    it('reads the summary content', () => {
      const resume = loadResume()
      expect(getEditRefValue({ kind: 'summary' }, resume)).toBe(resume.summary.content)
    })

    it('reads a raw entry field', () => {
      const resume = loadResume()
      const entry = resume.experience[0]
      expect(getEditRefValue({ kind: 'entry-field', sectionType: 'experience', entryId: entry.id, field: 'role' }, resume)).toBe(entry.role)
    })

    it('reads a bullet by index', () => {
      const resume = loadResume()
      const entry = resume.experience[0]
      expect(
        getEditRefValue({ kind: 'entry-list-item', sectionType: 'experience', entryId: entry.id, field: 'description', index: 0 }, resume)
      ).toBe(entry.description[0])
    })

    it('returns an empty string for a whole-entry ref', () => {
      const resume = loadResume()
      const entry = resume.experience[0]
      expect(getEditRefValue({ kind: 'entry', sectionType: 'experience', entryId: entry.id }, resume)).toBe('')
    })

    it('returns an empty string when the entry no longer exists', () => {
      const resume = loadResume()
      expect(getEditRefValue({ kind: 'entry-field', sectionType: 'experience', entryId: 'missing', field: 'role' }, resume)).toBe('')
    })
  })

  describe('applyEditRefValue', () => {
    it('commits a personal-info edit via updatePersonalInfo', () => {
      const resume = loadResume()
      applyEditRefValue({ kind: 'personal-info', field: 'fullName' }, 'Jordan Rivera', resume)
      expect(useResumeStore.getState().activeResume?.personalInfo.fullName).toBe('Jordan Rivera')
    })

    it('commits a summary edit via updateSummary', () => {
      const resume = loadResume()
      applyEditRefValue({ kind: 'summary' }, 'New summary text', resume)
      expect(useResumeStore.getState().activeResume?.summary.content).toBe('New summary text')
    })

    it('commits an entry-field edit for the correct entry only', () => {
      const resume = loadResume()
      const [first, second] = resume.experience
      applyEditRefValue({ kind: 'entry-field', sectionType: 'experience', entryId: first.id, field: 'role' }, 'Staff Engineer', resume)
      const updated = useResumeStore.getState().activeResume!
      expect(updated.experience.find((e) => e.id === first.id)?.role).toBe('Staff Engineer')
      expect(updated.experience.find((e) => e.id === second.id)?.role).toBe(second.role)
    })

    it('commits a bullet edit at the given index without touching other bullets', () => {
      const resume = loadResume()
      const entry = resume.experience[0]
      const originalSecondBullet = entry.description[1]
      applyEditRefValue({ kind: 'entry-list-item', sectionType: 'experience', entryId: entry.id, field: 'description', index: 0 }, 'Rewrote bullet one', resume)
      const updatedEntry = useResumeStore.getState().activeResume!.experience.find((e) => e.id === entry.id)!
      expect(updatedEntry.description[0]).toBe('Rewrote bullet one')
      expect(updatedEntry.description[1]).toBe(originalSecondBullet)
    })

    it('marks the resume dirty so autosave picks up the change', () => {
      const resume = loadResume()
      applyEditRefValue({ kind: 'summary' }, 'Edited', resume)
      expect(useResumeStore.getState().isDirty).toBe(true)
    })

    it('does nothing for a whole-entry ref', () => {
      const resume = loadResume()
      applyEditRefValue({ kind: 'entry', sectionType: 'experience', entryId: resume.experience[0].id }, 'ignored', resume)
      expect(useResumeStore.getState().isDirty).toBe(false)
    })
  })
})
