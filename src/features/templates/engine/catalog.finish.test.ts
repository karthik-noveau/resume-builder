import { describe, expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { clipShapeRadii } from '@/shared/utils/clipShape'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'
import { ALL_TEMPLATES, templateRenderer } from '../registry/template.registry'
import { estimateStyledTextHeight } from './layout.utils'

loadTemplateFonts()
const theme = useThemeStore.getState().getActiveTheme()
const fontPreset = useThemeStore.getState().getActiveFontPreset()
const flatten = (nodes: LayoutNode[]): LayoutNode[] => nodes.flatMap(node => [node, ...flatten(node.children)])

describe.each(ALL_TEMPLATES)('$name heading finish', (template) => {
  it.each(['default', 'long'] as const)('keeps %s headings measured, padded, and clear of entries', (length) => {
    const resume = createSampleResume(template.id)
    if (length === 'long') {
      resume.sectionTitles = {
        summary: 'Professional Background and Career Highlights',
        experience: 'Selected Experience and Leadership',
        education: 'Education and Professional Development',
        skills: 'Core Skills and Technical Expertise',
        projects: 'Selected Projects and Key Achievements',
        certifications: 'Certifications and Professional Credentials',
      }
    }
    const tree = templateRenderer.render(resume, template, theme, fontPreset)
    const nodes = tree.pages.flatMap(page => flatten(page.nodes))
    for (const node of nodes.filter(node => node.clipShape === 'rounded')) {
      const { x, y } = clipShapeRadii(node.clipShape, node.widthPt, node.heightPt)
      expect(x, 'rounded decorations must not have stretched elliptical corners').toBe(y)
    }
    const sections = nodes.filter(node => node.type === 'section')
    for (const section of sections) {
      const heading = section.children.find(node => node.editRef?.kind === 'section-title')
      if (!heading) continue // Continuation titles are intentionally not editable.
      const message = `${template.name}: ${heading.content}`
      const needed = estimateStyledTextHeight(heading.content!, heading.widthPt,
        heading.styles.fontSize, heading.styles.lineHeight, heading.styles.letterSpacing ?? 0,
        heading.styles.fontFamily, heading.styles.fontWeight)
      expect(heading.heightPt, message).toBeGreaterThanOrEqual(needed - 0.5)
      expect(heading.xPt, message).toBeGreaterThanOrEqual(0)
      expect(heading.xPt + heading.widthPt, message).toBeLessThanOrEqual(section.widthPt + 0.5)

      const band = section.children.find(node => node.type === 'rect'
        && node.xPt <= heading.xPt && node.yPt <= heading.yPt
        && node.xPt + node.widthPt >= heading.xPt + heading.widthPt
        && node.yPt + node.heightPt >= heading.yPt + heading.heightPt)
      if (band) {
        const left = heading.xPt - band.xPt
        const right = band.xPt + band.widthPt - heading.xPt - heading.widthPt
        const top = heading.yPt - band.yPt
        const bottom = band.yPt + band.heightPt - heading.yPt - heading.heightPt
        expect(left, message).toBeGreaterThanOrEqual(8)
        expect(right, message).toBeCloseTo(left)
        expect(top, message).toBeGreaterThanOrEqual(4)
        expect(bottom, message).toBeCloseTo(top)
      }
      const entry = section.children.find(node => node.type === 'entry')
      if (entry && entry.xPt < heading.xPt + heading.widthPt) {
        const end = band ? band.yPt + band.heightPt : heading.yPt + heading.heightPt
        expect(entry.yPt - end, message).toBeGreaterThanOrEqual(7.5)
      }
    }
  })
})
