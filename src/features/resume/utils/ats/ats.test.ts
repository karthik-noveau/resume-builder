import { describe, expect, it } from 'vitest'
import { createEmptyResume, createSampleResume } from '../resume.factory'
import { ALL_TEMPLATES, getTemplateById } from '@/features/templates/registry/template.registry'
import { cleanBullet, dateMonth, evaluateAts } from './evaluate'
import { planAtsFix } from './fixes'
import { evaluateJobMatch, extractJobKeywords } from './jobMatch'
import type { LayoutTree } from '@/shared/types/layout.types'

const template = getTemplateById('meridian')!
const now = new Date('2026-09-21T12:00:00Z')
const report = (resume = createSampleResume('meridian')) => evaluateAts(template, resume, null, now)
const check = (id: string, resume = createSampleResume('meridian')) =>
  report(resume).checks.find((c) => c.id === id)!

describe('advanced ATS readiness', () => {
  it('uses a transparent 100-point rubric and does not rate an empty resume highly', () => {
    const sample = report()
    expect(sample.categories.reduce((sum, c) => sum + c.max, 0)).toBe(100)
    expect(sample.categories.reduce((sum, c) => sum + c.score, 0)).toBe(sample.score)
    expect(report(createEmptyResume('meridian')).score).toBeLessThan(40)
    for (const definition of ALL_TEMPLATES) {
      const result = evaluateAts(definition, createSampleResume(definition.id), null, now)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.checks.length).toBeGreaterThanOrEqual(20)
    }
  })

  it('evaluates every visible role, not just one complete role', () => {
    const resume = createSampleResume('meridian')
    resume.experience[1] = { ...resume.experience[1], company: '', startDate: '', description: [] }
    expect(check('history-details', resume).points).toBe(4)
    expect(check('dates', resume).status).toBe('review')
    expect(check('descriptions', resume).points).toBeLessThan(5)
    resume.experience[1].visible = false
    expect(check('history-details', resume).points).toBe(8)
  })

  it('checks invalid contact formats and flags sample values', () => {
    const resume = createSampleResume('meridian')
    expect(check('placeholders', resume).status).toBe('review')
    resume.personalInfo.email = 'not-an-email'
    resume.personalInfo.phone = 'abc123'
    resume.personalInfo.website = 'not a url'
    expect(check('email', resume).points).toBe(0)
    expect(check('phone', resume).points).toBe(0)
    expect(check('links', resume).status).toBe('review')
  })

  it('excludes hidden or omitted content and supports projects instead of employment', () => {
    const resume = createSampleResume('meridian')
    resume.sectionOrder = ['projects']
    expect(check('history-details', resume).label).toBe('Project details')
    expect(check('summary', resume).points).toBe(0)
    expect(check('skills', resume).points).toBe(0)
    expect(check('education', resume).points).toBe(0)
    resume.projects[0].visible = false
    expect(check('history-details', resume).points).toBe(0)
  })

  it('does not mistake a year or software version for an achievement metric', () => {
    const resume = createSampleResume('meridian')
    resume.experience = [{ ...resume.experience[0], description: ['Used React 19 in 2025.'] }]
    expect(check('outcomes', resume).points).toBe(0)
    resume.experience[0].description = ['Reduced processing time by 20%.']
    expect(check('outcomes', resume).points).toBe(5)
  })

  it('accepts common present and past tense action verbs', () => {
    const resume = createSampleResume('meridian')
    resume.experience[0].description = ['Define the product roadmap.', 'Owned the release process.']
    expect(check('action-verbs', resume).status).toBe('passed')
  })

  it('checks real text-box bounds and sizes without claiming to parse a PDF', () => {
    const resume = createSampleResume('meridian')
    const tree: LayoutTree = {
      resumeId: resume.id,
      templateId: resume.templateId,
      themeId: 'light',
      fontPresetId: resume.fontPresetId,
      pageSize: 'A4',
      pages: [
        {
          pageNumber: 1,
          widthPt: 595,
          heightPt: 842,
          marginsPt: { top: 20, right: 20, bottom: 20, left: 20 },
          nodes: [
            {
              id: 'contact',
              type: 'text',
              content: 'Contact detail',
              xPt: 590,
              yPt: 20,
              widthPt: 100,
              heightPt: 10,
              children: [],
              styles: {
                fontFamily: 'Inter',
                fontSize: 8,
                fontWeight: 400,
                color: '#111111',
                lineHeight: 1.2,
                letterSpacing: 0,
                textAlign: 'left',
              },
            },
          ],
        },
      ],
    }
    const result = evaluateAts(template, resume, tree, now)
    expect(result.checks.find((c) => c.id === 'small-text')?.status).toBe('review')
    expect(result.checks.find((c) => c.id === 'page-bounds')?.status).toBe('review')
    expect(result.pageCount).toBe(1)
  })

  it('flags reversed, missing, and future employment dates while accepting ongoing roles', () => {
    const resume = createSampleResume('meridian')
    expect(check('dates', resume).status).toBe('passed')
    resume.experience = [
      { ...resume.experience[0], current: false, startDate: '2025-01', endDate: '2024-01' },
    ]
    expect(check('dates', resume).evidence.join(' ')).toContain('precedes')
    resume.experience[0].endDate = '2030'
    expect(check('dates', resume).evidence.join(' ')).toContain('future')
    resume.experience[0].endDate = ''
    expect(check('dates', resume).points).toBe(0)
  })

  it.each(['2024', '2024-01', 'Jan 2024', 'January 2024', 'Jan. 2024', '2024-01-31'])(
    'accepts an unambiguous date: %s',
    (value) => {
      expect(dateMonth(value)).toBe(2024 * 12)
    }
  )
  it.each(['2024-13', '2024-02-31', '01/02/24', '', 'yesterday'])(
    'rejects an invalid or ambiguous date: %s',
    (value) => {
      expect(dateMonth(value)).toBeNull()
    }
  )
})

describe('reviewable ATS fixes', () => {
  it('plans a fix without mutating content and only hides the photo setting', () => {
    const resume = createSampleResume('mosaic')
    const original = structuredClone(resume)
    const plan = planAtsFix('hide-photo', resume, ALL_TEMPLATES)!
    expect(resume).toEqual(original)
    expect(plan.patch.settings?.showProfileImage).toBe(false)
    expect(plan.patch.personalInfo).toBeUndefined()
    const fixed = { ...resume, ...plan.patch }
    expect(check('photo', fixed).status).toBe('passed')
    expect(planAtsFix('hide-photo', fixed, ALL_TEMPLATES)).toBeNull()
  })

  it('cleans duplicate bullets without inventing results or changing negative numbers', () => {
    const resume = createSampleResume('meridian')
    resume.experience[0].description = [
      '  • Built a dashboard.  ',
      'Built a dashboard.',
      '',
      '-5% year-over-year change.',
    ]
    const plan = planAtsFix('clean-bullets', resume, ALL_TEMPLATES)!
    expect(plan.patch.experience![0].description).toEqual([
      'Built a dashboard.',
      '-5% year-over-year change.',
    ])
    expect(cleanBullet('-5% decrease')).toBe('-5% decrease')
    expect(planAtsFix('clean-bullets', { ...resume, ...plan.patch }, ALL_TEMPLATES)).toBeNull()
  })

  it('deduplicates skills per group and preserves the first skill record and hidden groups', () => {
    const resume = createSampleResume('meridian')
    resume.skills[0].skills = [
      { id: 'first', name: 'SQL', level: 4 },
      { id: 'second', name: ' sql ', level: 2 },
    ]
    resume.skills[1].visible = false
    const plan = planAtsFix('deduplicate-skills', resume, ALL_TEMPLATES)!
    expect(plan.patch.skills![0].skills).toEqual([{ id: 'first', name: 'SQL', level: 4 }])
    expect(plan.patch.skills![1]).toEqual(resume.skills[1])
  })

  it('restores only unfamiliar visible headings', () => {
    const resume = createSampleResume('meridian')
    resume.sectionTitles = {
      experience: 'My adventure',
      summary: 'Profile',
      education: 'Learning journey',
    }
    resume.sectionOrder = ['summary', 'experience']
    const plan = planAtsFix('headings', resume, ALL_TEMPLATES)!
    expect(plan.patch.sectionTitles).toEqual({
      experience: 'Work Experience',
      summary: 'Profile',
      education: 'Learning journey',
    })
  })

  it('reorders complete work-history dates without changing entries', () => {
    const resume = createSampleResume('meridian')
    resume.experience[0].order = 1
    resume.experience[1].order = 0
    expect(check('chronology', resume).status).toBe('review')
    const plan = planAtsFix('sort-experience', resume, ALL_TEMPLATES)!
    expect(plan.patch.experience!.map((e) => e.id)).toEqual(resume.experience.map((e) => e.id))
    expect(plan.patch.experience![0].role).toBe(resume.experience[0].role)
    expect(check('chronology', { ...resume, ...plan.patch }).status).toBe('passed')
  })
})

describe('job keyword coverage', () => {
  it('preserves punctuation-sensitive terms and never matches Java inside JavaScript', () => {
    const resume = createEmptyResume('meridian')
    resume.summary.content = 'JavaScript React.js C++ C# .NET Node.js AWS'
    const match = evaluateJobMatch(resume, [
      'Java',
      'JavaScript',
      'React',
      'C++',
      'C#',
      '.NET',
      'Node.js',
      'AWS',
    ])
    expect(match.terms.find((t) => t.term === 'Java')?.matched).toBe(false)
    expect(match.matchedCount).toBe(7)
  })

  it('matches aliases and phrases, without counting hidden skills or URL text', () => {
    const resume = createSampleResume('meridian')
    resume.summary.content = 'Built services using Amazon Web Services and stakeholder-management.'
    resume.personalInfo.website = 'https://python.org'
    resume.sectionOrder = ['summary', 'skills']
    resume.skills.forEach((group) => {
      group.visible = false
    })
    const match = evaluateJobMatch(resume, ['AWS', 'Stakeholder management', 'Python', 'SQL'])
    expect(match.terms.map((t) => t.matched)).toEqual([true, true, false, false])
    expect(match.terms[0].locations).toContain('Summary')
  })

  it('extracts known keywords and supports manually entered domain terms', () => {
    const resume = createEmptyResume('meridian')
    const terms = extractJobKeywords(
      'Require C++, C#, .NET, Java and JavaScript plus customer service.',
      resume
    )
    expect(terms).toEqual(
      expect.arrayContaining(['C++', 'C#', '.NET', 'Java', 'JavaScript', 'Customer service'])
    )
    resume.summary.content = 'Experience in marine navigation.'
    expect(evaluateJobMatch(resume, ['marine navigation']).score).toBe(100)
  })

  it('deduplicates selected terms and does not create a score without keywords', () => {
    const resume = createSampleResume('meridian')
    expect(evaluateJobMatch(resume, []).score).toBeNull()
    expect(evaluateJobMatch(resume, ['SQL', ' sql ', 'SQL']).terms).toHaveLength(1)
    expect(extractJobKeywords(' ', resume)).toEqual([])
  })
})
