import { describe, expect, it } from 'vitest'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'
import { getTemplateColorConfiguration, resolveTemplateColors } from './templateColors'

describe('template colors', () => {
  it('exposes only the semantic color roles used by the selected template', () => {
    const foundation = getTemplateColorConfiguration('fresher-sidebar-photo')
    const clarity = getTemplateColorConfiguration('experienced-icon-minimal')

    expect(foundation.fields).toContain('panelBackground')
    expect(foundation.fields).toContain('panelText')
    expect(foundation.fields).toContain('sectionBorder')
    expect(foundation.fields).not.toContain('sectionIcon')
    expect(clarity.fields).not.toContain('panelBackground')
    expect(clarity.fields).toContain('mutedText')
    expect(clarity.fields).not.toContain('sectionIcon')
  })

  it('merges saved overrides over template defaults', () => {
    const resume = createEmptyResume('fresher-sidebar-photo')
    resume.templateColors = {
      accent: '#abcdef',
      panelBackground: '#123456',
      mutedText: '#654321',
      sectionTitle: '#fedcba',
      sectionBorder: '#112233',
    }

    const colors = resolveTemplateColors(resume)
    expect(colors.accent).toBe('#abcdef')
    expect(colors.panelBackground).toBe('#123456')
    expect(colors.mutedText).toBe('#654321')
    expect(colors.sectionTitle).toBe('#fedcba')
    expect(colors.sectionBorder).toBe('#112233')
    expect(colors.primaryText).toBe('#111827')
  })

  it('keeps legacy custom accents while allowing the new accent override to win', () => {
    const resume = createEmptyResume('atlas')
    resume.themeId = 'custom'
    resume.customPrimaryColor = '#111111'

    expect(resolveTemplateColors(resume).accent).toBe('#111111')
    expect(resolveTemplateColors(resume).sectionTitle).toBe('#111111')
    resume.templateColors = { accent: '#222222' }
    expect(resolveTemplateColors(resume).accent).toBe('#222222')
    expect(resolveTemplateColors(resume).sectionIcon).toBe('#222222')
  })

  it('keeps section icons the same color as section-heading text', () => {
    const resume = createEmptyResume('experienced-icon-minimal')
    resume.templateColors = { sectionTitle: '#123456', sectionIcon: '#abcdef' }

    const colors = resolveTemplateColors(resume)
    expect(colors.sectionTitle).toBe('#123456')
    expect(colors.sectionIcon).toBe('#123456')
  })
})
