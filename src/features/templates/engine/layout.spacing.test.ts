import { describe, expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { AVAILABLE_FONT_PRESETS, useThemeStore } from '@/shared/stores/theme.store'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'
import { getTemplateById, templateRenderer } from '../registry/template.registry'
import { LayoutBuilder } from './layout.builder'
import {
  buildCertEntry,
  buildEducationEntry,
  buildExperienceEntry,
  buildProjectEntry,
  buildRatedSkillGroup,
} from './section.renderers'
import { estimateStyledTextHeight } from './layout.utils'

loadTemplateFonts()
const theme = useThemeStore.getState().getActiveTheme()
const fp = useThemeStore.getState().getActiveFontPreset()
const resume = createSampleResume('aster')
const builder = new LayoutBuilder({
  resumeId: resume.id,
  templateId: 'aster',
  themeId: theme.id,
  fontPresetId: fp.id,
  pageSize: 'A4',
  marginMm: 15,
})

describe('shared resume spacing and alignment', () => {
  it.each(AVAILABLE_FONT_PRESETS)('measures long education grades with the $name preset', (preset) => {
    for (const width of [160, 350]) {
      const entry = { ...resume.education[0], grade: 'First Class Honours, 3.85 / 4.0' }
      const result = buildEducationEntry(builder, entry, width, theme.colors, preset, false)
      const grade = result.nodes.find(node => node.content?.startsWith('GPA:'))!
      const institution = result.nodes.find(node => node.content === entry.institution)!
      expect(grade.xPt).toBe(0)
      expect(grade.widthPt).toBe(width)
      expect(grade.yPt).toBeGreaterThanOrEqual(institution.yPt + institution.heightPt + 3)
      expect(grade.heightPt).toBeGreaterThanOrEqual(estimateStyledTextHeight(
        grade.content!, grade.widthPt, grade.styles.fontSize, grade.styles.lineHeight,
        0, grade.styles.fontFamily, grade.styles.fontWeight,
      ))
      expect(result.height).toBeCloseTo(grade.yPt + grade.heightPt)
    }
  })

  it('measures bold continuation headings before placing the next entry', () => {
    const sample = createSampleResume('byline')
    sample.sectionTitles = { experience: 'Professional Experience and Leadership' }
    sample.experience = Array.from({ length: 6 }, (_, index) => ({ ...sample.experience[0], id: `experience-${index}` }))
    const tree = templateRenderer.render(sample, getTemplateById('byline')!, theme, fp)
    const headings = tree.pages.flatMap(page => page.nodes.flatMap(section => section.children))
      .filter(node => node.type === 'text' && node.content?.includes('(continued)'))
    expect(headings.length).toBeGreaterThan(0)
    for (const heading of headings) {
      expect(heading.heightPt).toBeGreaterThanOrEqual(estimateStyledTextHeight(
        heading.content!, heading.widthPt, heading.styles.fontSize, heading.styles.lineHeight,
        heading.styles.letterSpacing, heading.styles.fontFamily, heading.styles.fontWeight,
      ))
    }
  })

  it('measures sidebar contact links with the selected font', () => {
    const sample = createSampleResume('studio', { pageSize: 'LETTER' })
    const executive = AVAILABLE_FONT_PRESETS.find(preset => preset.id === 'executive')!
    const tree = templateRenderer.render(sample, getTemplateById('studio')!, theme, executive)
    const link = tree.pages.flatMap(page => page.nodes).find(node =>
      node.editRef?.kind === 'personal-info' && node.editRef.field === 'linkedin')!
    expect(link.styles.fontFamily).toBe('SourceSerifPro')
    expect(link.heightPt).toBeGreaterThanOrEqual(estimateStyledTextHeight(
      link.content!, link.widthPt, link.styles.fontSize, link.styles.lineHeight,
      link.styles.letterSpacing, link.styles.fontFamily, link.styles.fontWeight,
    ))
  })

  it.each(['ledger', 'graphite', 'harbor', 'studio'])('%s separates name and headline with the modern font', (id) => {
    const modern = AVAILABLE_FONT_PRESETS.find(preset => preset.id === 'modern')!
    const tree = templateRenderer.render(createSampleResume(id), getTemplateById(id)!, theme, modern)
    const nodes = tree.pages[0].nodes
    const name = nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'fullName')!
    const headline = nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'headline')!
    expect(headline.yPt - name.yPt - name.heightPt).toBeGreaterThanOrEqual(6 - 0.01)
  })

  it('leaves a real gutter between certification titles and dates', () => {
    const { nodes } = buildCertEntry(
      builder,
      resume.certifications[0],
      350,
      theme.colors,
      fp,
      false
    )
    const [title, date] = nodes
    expect(date.xPt - title.xPt - title.widthPt).toBeGreaterThanOrEqual(14)
  })

  it('stacks narrow metadata instead of squeezing it into competing columns', () => {
    const entry = {
      ...resume.experience[0],
      company: 'International Design and Technology Studio',
      location: 'San Francisco, California',
    }
    const { nodes } = buildExperienceEntry(builder, entry, 160, theme.colors, fp, false)
    const company = nodes.find((node) => node.content === entry.company)!
    const location = nodes.find((node) => node.content === entry.location)!
    expect(company.widthPt).toBe(160)
    expect(location.xPt).toBe(0)
    expect(location.yPt).toBeGreaterThanOrEqual(company.yPt + company.heightPt + 3)
  })

  it('has no invisible trailing spacer inside project entries', () => {
    const result = buildProjectEntry(builder, resume.projects[0], 300, theme.colors, fp, false)
    expect(result.height).toBe(Math.max(...result.nodes.map((node) => node.yPt + node.heightPt)))
  })

  it.each(['bars', 'dots'] as const)('centers skill %s on the first text line', (presentation) => {
    const result = buildRatedSkillGroup(
      builder,
      resume.skills[0],
      170,
      theme.colors,
      fp,
      presentation
    )
    const label = result.nodes.find((node) => node.content === resume.skills[0].skills[0].name)!
    const rating = result.nodes.find((node) => node.type === 'rect')!
    expect(rating.yPt + rating.heightPt / 2).toBeCloseTo(
      label.yPt + (label.styles.fontSize * label.styles.lineHeight) / 2
    )
  })

  it.each(['strata', 'vector', 'orbit', 'atelier'])(
    '%s starts its two text columns on the same row',
    (id) => {
      const tree = templateRenderer.render(createSampleResume(id), getTemplateById(id)!, theme, fp)
      const firstByColumn = new Map<number, number>()
      for (const node of tree.pages[0].nodes.filter((node) => node.type === 'section')) {
        firstByColumn.set(node.xPt, Math.min(firstByColumn.get(node.xPt) ?? Infinity, node.yPt))
      }
      expect(firstByColumn.size).toBe(2)
      const starts = [...firstByColumn.values()]
      expect(starts[0]).toBeCloseTo(starts[1])
    }
  )
})
