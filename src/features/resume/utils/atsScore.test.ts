import { describe, it, expect } from 'vitest'
import { calculateAtsScore, scoreTemplate, scoreContent, TEMPLATE_MAX, CONTENT_MAX } from './atsScore'
import { createSampleResume } from './resume.factory'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import type { Resume } from '@/shared/types/resume.types'

const singleColumn = ALL_TEMPLATES.find((t) => t.layout === 'single-column')!

/** Keep every property except the column structure identical for comparison. */
const twoColumn = { ...singleColumn, id: 'two-column-fixture', layout: 'two-column' as const }

describe('scoreTemplate', () => {
  it('rewards single-column reading order over two-column', () => {
    expect(scoreTemplate(singleColumn).score).toBeGreaterThan(scoreTemplate(twoColumn).score)
  })

  it('never exceeds the template maximum', () => {
    for (const tpl of ALL_TEMPLATES) {
      expect(scoreTemplate(tpl).score).toBeLessThanOrEqual(TEMPLATE_MAX)
      expect(scoreTemplate(tpl).score).toBeGreaterThan(0)
    }
  })

  it('penalises a photo region', () => {
    const withPhoto = { ...twoColumn, exportRules: { ...twoColumn.exportRules, includeProfileImage: true } }
    const without = { ...twoColumn, exportRules: { ...twoColumn.exportRules, includeProfileImage: false } }
    expect(scoreTemplate(without).score).toBeGreaterThan(scoreTemplate(withPhoto).score)
  })

  it('explains every deduction', () => {
    for (const f of scoreTemplate(twoColumn).factors) {
      if (f.points < f.max) expect(f.hint).toBeTruthy()
    }
  })
})

describe('scoreContent', () => {
  const full = createSampleResume(singleColumn.id)

  it('scores the seeded resume highly', () => {
    expect(scoreContent(full).score).toBe(CONTENT_MAX)
  })

  it('drops when contact details are missing', () => {
    const r: Resume = { ...full, personalInfo: { ...full.personalInfo, phone: '', email: '' } }
    expect(scoreContent(r).score).toBeLessThan(scoreContent(full).score)
  })

  it('drops when no bullet contains a number', () => {
    const r: Resume = {
      ...full,
      experience: full.experience.map((e) => ({ ...e, description: ['Did some work'] })),
    }
    expect(scoreContent(r).score).toBeLessThan(scoreContent(full).score)
  })

  it('scores an empty resume at zero', () => {
    const empty: Resume = {
      ...full,
      personalInfo: { ...full.personalInfo, email: '', phone: '', location: '' },
      summary: { ...full.summary, content: '' },
      experience: [],
      education: [],
      skills: [],
    }
    expect(scoreContent(empty).score).toBe(0)
  })

  it('does not count populated sections excluded from the rendered resume', () => {
    expect(scoreContent({ ...full, sectionOrder: [] }).score).toBe(10)
    expect(scoreContent({
      ...full,
      summary: { ...full.summary, visible: false },
      experience: full.experience.map((entry) => ({ ...entry, visible: false })),
      skills: full.skills.map((entry) => ({ ...entry, visible: false })),
      education: full.education.map((entry) => ({ ...entry, visible: false })),
    }).score).toBe(10)
  })

  it('does not reward whitespace-only contact details, roles, or skill names', () => {
    expect(scoreContent({
      ...full,
      personalInfo: { ...full.personalInfo, fullName: ' ', email: ' ', phone: ' ', location: ' ' },
      experience: full.experience.map((entry) => ({ ...entry, role: ' ', company: ' ', startDate: ' ', description: [] })),
      skills: full.skills.map((entry) => ({ ...entry, skills: [{ id: 'blank', name: ' ' }] })),
    }).score).toBe(10)
  })

  it('explains every deduction', () => {
    const empty: Resume = { ...full, experience: [], education: [], skills: [] }
    for (const f of scoreContent(empty).factors) {
      if (f.points < f.max) expect(f.hint).toBeTruthy()
    }
  })
})

describe('calculateAtsScore', () => {
  it('returns template-only when no resume is supplied', () => {
    const r = calculateAtsScore(singleColumn, null)
    expect(r.contentScore).toBeNull()
    expect(r.score).toBe(r.templateScore)
    expect(r.score).toBeLessThanOrEqual(TEMPLATE_MAX)
  })

  it('combines both halves when a resume is supplied', () => {
    const resume = createSampleResume(singleColumn.id)
    const r = calculateAtsScore(singleColumn, resume)
    expect(r.contentScore).not.toBeNull()
    expect(r.score).toBe(r.templateScore + (r.contentScore ?? 0))
    expect(r.score).toBeLessThanOrEqual(TEMPLATE_MAX + CONTENT_MAX)
  })

  it('gives the same resume a different score per template', () => {
    const resume = createSampleResume(singleColumn.id)
    expect(calculateAtsScore(singleColumn, resume).score)
      .not.toBe(calculateAtsScore(twoColumn, resume).score)
  })

  it('never exceeds 100', () => {
    const resume = createSampleResume(singleColumn.id)
    for (const tpl of ALL_TEMPLATES) {
      expect(calculateAtsScore(tpl, resume).score).toBeLessThanOrEqual(100)
    }
  })

  it('scores the actual profile-image setting instead of the template default', () => {
    const withPhoto = { ...singleColumn, exportRules: { ...singleColumn.exportRules, includeProfileImage: true } }
    const resume = createSampleResume(singleColumn.id)
    expect(calculateAtsScore(withPhoto, resume).score).toBe(91)
    expect(calculateAtsScore(withPhoto, { ...resume, settings: { ...resume.settings, showProfileImage: false } }).score).toBe(100)
    expect(calculateAtsScore({ ...withPhoto, exportRules: { ...withPhoto.exportRules, includeProfileImage: false } }, resume).score).toBe(100)
  })
})
