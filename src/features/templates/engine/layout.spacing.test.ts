import { describe, expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'
import { getTemplateById, templateRenderer } from '../registry/template.registry'
import { LayoutBuilder } from './layout.builder'
import {
  buildCertEntry,
  buildExperienceEntry,
  buildProjectEntry,
  buildRatedSkillGroup,
} from './section.renderers'

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
