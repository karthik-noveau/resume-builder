import { describe, expect, it } from 'vitest'
import {
  ALL_TEMPLATES,
  getTemplateById,
  templateRenderer,
} from '@/features/templates/registry/template.registry'
import { resolveResumeTheme, useThemeStore } from '@/shared/stores/theme.store'
import type { Resume } from '@/shared/types/resume.types'
import { createSampleResume } from '../resume.factory'
import { inspectAtsLayout } from './layoutChecks'
import { planAtsFix } from './fixes'
import { evaluateAts } from './evaluate'

function render(resume: Resume) {
  return templateRenderer.render(
    resume,
    getTemplateById(resume.templateId)!,
    resolveResumeTheme(resume.themeId, resume.customPrimaryColor),
    useThemeStore.getState().getFontPresetById(resume.fontPresetId)
  )
}

describe('ready-to-apply design fixes', () => {
  it.each(ALL_TEMPLATES.map((template) => template.id))(
    'fixes small text in the %s sample without page overflow',
    (id) => {
      const resume = createSampleResume(id)
      const original = structuredClone(resume)
      const before = inspectAtsLayout(render(resume))
      const plan = planAtsFix('readable-text', resume, ALL_TEMPLATES)
      expect(resume).toEqual(original)
      if (!before.tiny.length) {
        expect(plan).toBeNull()
        return
      }
      expect(plan).not.toBeNull()
      const fixed = { ...resume, ...plan!.patch }
      const after = inspectAtsLayout(render(fixed))
      expect(after.tiny).toHaveLength(0)
      expect(after.outside).toHaveLength(0)
      expect(Object.keys(plan!.patch)).toEqual(['styleOverrides'])
      expect(planAtsFix('readable-text', fixed, ALL_TEMPLATES)).toBeNull()
    }
  )

  it('preserves colors, typefaces, content and existing larger text while raising local small text', () => {
    const resume = createSampleResume('mosaic')
    resume.styleOverrides = {
      roles: {
        body: { fontSize: 11, color: '#123456' },
        small: { fontSize: 8, fontFamily: 'Inter' },
      },
      elements: { 'personal:email': { fontSize: 6, color: '#654321' } },
      page: { backgroundColor: '#ffffff' },
    }
    const plan = planAtsFix('readable-text', resume, ALL_TEMPLATES)!
    expect(plan.patch.styleOverrides?.roles?.body).toEqual(resume.styleOverrides.roles?.body)
    expect(plan.patch.styleOverrides?.roles?.small).toMatchObject({ fontFamily: 'Inter' })
    expect(plan.patch.styleOverrides?.elements?.['personal:email']).toEqual({
      fontSize: 9,
      color: '#654321',
    })
    expect(plan.patch.styleOverrides?.page).toEqual(resume.styleOverrides.page)
    const fixed = { ...resume, ...plan.patch }
    expect(fixed.experience).toEqual(resume.experience)
    expect(fixed.personalInfo).toEqual(resume.personalInfo)
    expect(fixed.settings).toEqual(resume.settings)
  })

  it('repairs overflow from individual sizing without resetting unrelated design choices', () => {
    const resume = createSampleResume('experienced-icon-minimal')
    resume.styleOverrides = {
      elements: { 'summary:text': { fontSize: 80, color: '#234567' } },
      roles: { name: { color: '#345678' } },
    }
    const original = structuredClone(resume)
    expect(inspectAtsLayout(render(resume)).outside.length).toBeGreaterThan(0)
    const plan = planAtsFix('page-bounds', resume, ALL_TEMPLATES)!
    expect(plan).not.toBeNull()
    expect(resume).toEqual(original)
    const fixed = { ...resume, ...plan.patch }
    expect(inspectAtsLayout(render(fixed)).outside).toHaveLength(0)
    expect(fixed.styleOverrides?.elements?.['summary:text']?.color).toBe('#234567')
    expect(fixed.styleOverrides?.roles?.name).toEqual(resume.styleOverrides.roles?.name)
    expect(fixed.settings).toEqual(resume.settings)
    expect(fixed.templateId).toBe(resume.templateId)
    expect(fixed.summary).toEqual(resume.summary)
    expect(planAtsFix('page-bounds', fixed, ALL_TEMPLATES)).toBeNull()
  })

  it('does not offer a small-text fix that would leave overflowing content', () => {
    const resume = createSampleResume('experienced-icon-minimal')
    resume.styleOverrides = { elements: { 'summary:text': { fontSize: 80 } } }
    expect(planAtsFix('readable-text', resume, ALL_TEMPLATES)).toBeNull()
  })

  it('connects design warnings to the corresponding fixes and handles unavailable templates', () => {
    const resume = createSampleResume('mosaic')
    const report = evaluateAts(getTemplateById(resume.templateId)!, resume, render(resume))
    expect(report.checks.find((check) => check.id === 'small-text')?.fix).toBe('readable-text')
    expect(report.checks.find((check) => check.id === 'page-bounds')?.fix).toBe('page-bounds')
    expect(
      planAtsFix('readable-text', { ...resume, templateId: 'unavailable' }, ALL_TEMPLATES)
    ).toBeNull()
  })
})
