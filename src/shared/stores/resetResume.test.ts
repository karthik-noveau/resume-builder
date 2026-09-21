import { describe, it, expect, beforeEach } from 'vitest'
import { createEmptyResume, createSampleResume, defaultAppearance } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from './resume.store'
import { useEditorStore } from './editor.store'
import type { Resume } from '@/shared/types/resume.types'

/** A resume that has been styled, re-themed, re-ordered and re-configured. */
function customised(): Resume {
  const resume = createSampleResume('meridian')
  return {
    ...resume,
    themeId: 'dark',
    fontPresetId: 'elegant',
    customPrimaryColor: '#ff0000',
    templateColors: { accent: '#00ff00' },
    sectionOrder: ['certifications', 'projects', 'skills', 'education', 'experience', 'summary'],
    sectionTitles: { experience: 'Where I have worked' },
    styleOverrides: {
      roles: { name: { fontSize: 40 } },
      elements: { 'personal:fullName': { color: '#123456' } },
      page: { backgroundColor: '#eeeeee' },
    },
    settings: {
      ...resume.settings,
      pageSize: 'LETTER',
      margins: { top: 5, right: 5, bottom: 5, left: 5 },
      spacingDensity: 'compact',
      typographyScale: 'small',
    },
  }
}

describe('resetResume', () => {
  beforeEach(() => {
    useEditorStore.setState({ undoStack: [], redoStack: [], styleTarget: null })
    useResumeStore.setState({ activeResume: customised(), isDirty: false })
  })

  const active = () => useResumeStore.getState().activeResume!

  it('returns every appearance field to what a new resume starts with', () => {
    useResumeStore.getState().resetResume({ content: false, appearance: true })
    const defaults = defaultAppearance()

    expect(active().themeId).toBe(defaults.themeId)
    expect(active().fontPresetId).toBe(defaults.fontPresetId)
    expect(active().customPrimaryColor).toBeUndefined()
    expect(active().templateColors).toBeUndefined()
    expect(active().styleOverrides).toBeUndefined()
    expect(active().sectionOrder).toEqual(defaults.sectionOrder)
    expect(active().settings).toEqual(defaults.settings)
  })

  it('leaves every word of the content alone', () => {
    // Snapshot the resume actually in the store: customised() mints new ids on
    // every call, so rebuilding it would compare against a different document.
    const before = structuredClone(active())
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(active().personalInfo).toEqual(before.personalInfo)
    expect(active().summary.content).toBe(before.summary.content)
    expect(active().experience).toEqual(before.experience)
    expect(active().education).toEqual(before.education)
    expect(active().skills).toEqual(before.skills)
    expect(active().projects).toEqual(before.projects)
    expect(active().certifications).toEqual(before.certifications)
  })

  it('keeps the chosen template, which has no default to fall back to', () => {
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(active().templateId).toBe('meridian')
  })

  it('keeps headings the user renamed, which are wording rather than styling', () => {
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(active().sectionTitles).toEqual({ experience: 'Where I have worked' })
  })

  it('is undoable', () => {
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(useEditorStore.getState().undoStack).toHaveLength(1)
    expect(useEditorStore.getState().undoStack[0].themeId).toBe('dark')
  })

  it('drops the inspector target, which may have just lost its overrides', () => {
    useEditorStore.setState({ styleTarget: { key: 'personal:fullName', role: null, label: 'Name' } })
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(useEditorStore.getState().styleTarget).toBeNull()
  })

  it('marks the resume dirty so the reset is persisted', () => {
    useResumeStore.getState().resetResume({ content: false, appearance: true })

    expect(useResumeStore.getState().isDirty).toBe(true)
  })

  it('does nothing when no resume is open', () => {
    useResumeStore.setState({ activeResume: null })

    expect(() =>
      useResumeStore.getState().resetResume({ content: false, appearance: true }),
    ).not.toThrow()
    expect(useEditorStore.getState().undoStack).toHaveLength(0)
  })

  it('does nothing when neither half is chosen', () => {
    const before = structuredClone(active())
    useResumeStore.getState().resetResume({ content: false, appearance: false })

    expect(active()).toEqual(before)
    expect(useEditorStore.getState().undoStack).toHaveLength(0)
  })

  describe('content', () => {
    it('restores the blank content a new resume begins with', () => {
      const starter = createEmptyResume('meridian')
      useResumeStore.getState().resetResume({ content: true, appearance: false })

      expect(active().personalInfo).toEqual(starter.personalInfo)
      expect(active().summary.content).toBe(starter.summary.content)
      expect(active().experience.map((e) => e.role)).toEqual(
        starter.experience.map((e) => e.role),
      )
      expect(active().education.map((e) => e.institution)).toEqual(
        starter.education.map((e) => e.institution),
      )
      expect(active().skills).toHaveLength(starter.skills.length)
      expect(active().projects).toHaveLength(starter.projects.length)
      expect(active().certifications).toHaveLength(starter.certifications.length)
    })

    it('discards headings written over the defaults', () => {
      useResumeStore.getState().resetResume({ content: true, appearance: false })

      expect(active().sectionTitles).toBeUndefined()
    })

    it('clears entries and gives the blank summary a fresh identity', () => {
      const oldSummaryId = active().summary.id
      useResumeStore.getState().resetResume({ content: true, appearance: false })

      expect(active().experience).toEqual([])
      expect(active().summary.id).not.toBe(oldSummaryId)
    })

    it('leaves the design alone', () => {
      useResumeStore.getState().resetResume({ content: true, appearance: false })

      expect(active().themeId).toBe('dark')
      expect(active().fontPresetId).toBe('elegant')
      expect(active().styleOverrides).toBeDefined()
      expect(active().settings.pageSize).toBe('LETTER')
    })

    it('keeps the resume identifiable', () => {
      const { id, title, createdAt } = active()
      useResumeStore.getState().resetResume({ content: true, appearance: false })

      expect(active()).toMatchObject({ id, title, createdAt })
    })
  })

  describe('both halves together', () => {
    it('resets content and design in a single undo step', () => {
      useResumeStore.getState().resetResume({ content: true, appearance: true })

      expect(active().personalInfo.fullName).toBe(createEmptyResume('meridian').personalInfo.fullName)
      expect(active().themeId).toBe('light')
      expect(active().styleOverrides).toBeUndefined()
      // One entry, not one per half.
      expect(useEditorStore.getState().undoStack).toHaveLength(1)
    })
  })
})
