import { describe, it, expect } from 'vitest'
import { calculateCompleteness } from './resumeCompleteness'
import { createEmptyResume, createSampleResume } from './resume.factory'

describe('calculateCompleteness', () => {
  it('scores the opt-in sample resume as fully complete', () => {
    const resume = createSampleResume('meridian')
    expect(calculateCompleteness(resume)).toBe(100)
  })

  it('scores a blank resume as 0', () => {
    const resume = createEmptyResume('meridian')
    expect(calculateCompleteness(resume)).toBe(0)
  })

  it('scores partial completeness proportionally', () => {
    const resume = createSampleResume('meridian')
    resume.summary.content = ''
    resume.education = []
    resume.skills = []
    // personal info (30) + experience (25) filled, summary/education/skills empty
    expect(calculateCompleteness(resume)).toBe(55)
  })
})
