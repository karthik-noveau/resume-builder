import { describe, expect, it } from 'vitest'
import { createEmptyResume, createSampleResume } from '@/features/resume/utils/resume.factory'
import { getGuidedMockPatch, getGuidedStepErrors, hasGuidedStepContent, type GuidedStep } from './guidedSetup'

const steps: GuidedStep[] = ['personal', 'summary', 'experience', 'education', 'skills']

describe('guided setup requirements', () => {
  it.each(steps)('requires content in the %s step, and its mock data satisfies the requirements', (step) => {
    const resume = createEmptyResume('meridian')
    expect(getGuidedStepErrors(resume, step).length).toBeGreaterThan(0)
    expect(hasGuidedStepContent(resume, step)).toBe(false)
    const filled = { ...resume, ...getGuidedMockPatch(resume, step) }
    expect(getGuidedStepErrors(filled, step)).toEqual([])
    expect(hasGuidedStepContent(filled, step)).toBe(true)
  })

  it('requires only name and a valid email from personal details', () => {
    const resume = createEmptyResume('meridian')
    resume.personalInfo.fullName = 'Jordan Rivera'
    resume.personalInfo.email = 'jordan@example.com'
    expect(getGuidedStepErrors(resume, 'personal')).toEqual([])
    resume.personalInfo.email = 'not-an-email'
    expect(getGuidedStepErrors(resume, 'personal').length).toBeGreaterThan(0)
  })

  it('rejects whitespace-only required fields', () => {
    const resume = createSampleResume('meridian')
    resume.personalInfo.fullName = '  '
    resume.summary.content = '  '
    resume.experience[0].role = '  '
    resume.education[0].degree = '  '
    resume.skills[0].skills[0].name = '  '
    for (const step of steps) expect(getGuidedStepErrors(resume, step).length).toBeGreaterThan(0)
  })

  it('checks all entries, not just the first filled entry', () => {
    const resume = createSampleResume('meridian')
    resume.experience[1].company = ''
    expect(getGuidedStepErrors(resume, 'experience')).toContain('Company for experience 2 is required.')
    resume.skills[1].skills = []
    expect(getGuidedStepErrors(resume, 'skills')).toContain('Add at least one skill to skill group 2.')
  })

  it('preserves the profile photo, summary identity, and section settings when mocking', () => {
    const resume = createSampleResume('meridian')
    resume.personalInfo.profileImage = 'photo-id'
    resume.summary.visible = false
    expect(getGuidedMockPatch(resume, 'personal').personalInfo?.profileImage).toBe('photo-id')
    expect(getGuidedMockPatch(resume, 'summary').summary).toMatchObject({ id: resume.summary.id, visible: false })
  })
})
