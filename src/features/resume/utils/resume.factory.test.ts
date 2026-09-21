import { describe, expect, it } from 'vitest'
import { createEmptyResume, createSampleResume, sampleContent } from './resume.factory'
import { resumeSchema } from '@/shared/schemas/resume.schema'

describe('new resume content', () => {
  it('starts with valid, blank fields and no example entries', () => {
    const resume = createEmptyResume('meridian')
    expect(resumeSchema.safeParse(resume).success).toBe(true)
    expect(Object.values(resume.personalInfo).every((value) => value === '')).toBe(true)
    expect(resume.summary.content).toBe('')
    for (const section of ['experience', 'education', 'skills', 'projects', 'certifications', 'customSections'] as const) {
      expect(resume[section]).toEqual([])
    }
  })

  it('preserves the chosen template and appearance defaults on blank creation', () => {
    const resume = createEmptyResume('atlas', {
      themeId: 'dark', fontPresetId: 'elegant', pageSize: 'LETTER', customPrimaryColor: '#123456',
    })
    expect(resume).toMatchObject({
      templateId: 'atlas', themeId: 'dark', fontPresetId: 'elegant',
      customPrimaryColor: '#123456', settings: { pageSize: 'LETTER' },
    })
  })

  it('keeps complete sample content available for previews and mock data', () => {
    const sample = createSampleResume('meridian')
    expect(resumeSchema.safeParse(sample).success).toBe(true)
    expect(sample.personalInfo.fullName).toBe('Alex Morgan')
    expect(sample.summary.content).not.toBe('')
    for (const section of ['experience', 'education', 'skills', 'projects', 'certifications'] as const) {
      expect(sample[section].length).toBeGreaterThan(0)
    }
  })

  it('only includes content in the mock-data patch, with fresh entry IDs per use', () => {
    const first = sampleContent()
    const second = sampleContent()
    expect(Object.keys(first).sort()).toEqual([
      'personalInfo', 'summary', 'experience', 'education', 'skills', 'projects',
      'certifications', 'customSections', 'sectionTitles',
    ].sort())
    expect(first.experience[0].id).not.toBe(second.experience[0].id)
  })
})
