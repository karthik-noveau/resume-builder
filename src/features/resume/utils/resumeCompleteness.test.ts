import { describe, it, expect } from 'vitest'
import { calculateCompleteness } from './resumeCompleteness'
import { createEmptyResume } from './resume.factory'

describe('calculateCompleteness', () => {
  it('scores the sample resume from createEmptyResume as fully complete', () => {
    const resume = createEmptyResume('meridian')
    expect(calculateCompleteness(resume)).toBe(100)
  })

  it('scores a blank resume as 0', () => {
    const resume = createEmptyResume('meridian')
    resume.personalInfo = { fullName: '', headline: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', portfolio: '' }
    resume.summary.content = ''
    resume.experience = []
    resume.education = []
    resume.skills = []
    expect(calculateCompleteness(resume)).toBe(0)
  })

  it('scores partial completeness proportionally', () => {
    const resume = createEmptyResume('meridian')
    resume.summary.content = ''
    resume.education = []
    resume.skills = []
    // personal info (30) + experience (25) filled, summary/education/skills empty
    expect(calculateCompleteness(resume)).toBe(55)
  })
})
