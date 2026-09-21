import { describe, expect, it } from 'vitest'
import { createEmptyResume, createSampleResume } from './resume.factory'
import { hasResumeContent } from './resumeContent'

describe('hasResumeContent', () => {
  it('rejects blank drafts even when they have a title, template, and empty section records', () => {
    const resume = createEmptyResume('fresher-sidebar-photo')
    resume.title = 'My next role'
    resume.personalInfo.fullName = '   '
    resume.skills = [{ ...createSampleResume('meridian').skills[0], category: 'New Category', skills: [] }]
    expect(hasResumeContent(resume)).toBe(false)
  })

  it('accepts real personal details without requiring every guided section', () => {
    const resume = createEmptyResume('meridian')
    resume.personalInfo.fullName = 'Jordan Rivera'
    expect(hasResumeContent(resume)).toBe(true)
  })

  it.each(['summary', 'experience', 'education', 'skills', 'projects', 'certifications'] as const)(
    'recognizes visible %s content, but not a hidden section', (section) => {
      const resume = createEmptyResume('meridian')
      const sample = createSampleResume('meridian')
      Object.assign(resume, { [section]: sample[section] })
      expect(hasResumeContent(resume)).toBe(true)
      if (section === 'summary') resume.summary.visible = false
      else resume[section].forEach((entry) => { entry.visible = false })
      expect(hasResumeContent(resume)).toBe(false)
    },
  )
})
