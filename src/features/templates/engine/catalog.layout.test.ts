import { describe, it, expect } from 'vitest'
import { ALL_TEMPLATES, getTemplateById, templateRenderer } from '../registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import type { Resume } from '@/shared/types/resume.types'
import type { LayoutNode, LayoutPage } from '@/shared/types/layout.types'
import { estimateStyledTextHeight } from './layout.utils'
import { registeredSpecs } from './template.kit'
import { fontRegistry } from '@/shared/services/font.registry'
import { getTemplateColorConfiguration } from '@/shared/utils/templateColors'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'

loadTemplateFonts()

/**
 * Geometric invariants every template in the catalog must satisfy, on both a
 * short resume and one long enough to spill over several pages.
 *
 * These are the failures that read as "misaligned" on screen: text starting
 * outside the text column, a block running off the bottom of the sheet,
 * sections colliding, or a section box shorter than the content inside it.
 * Checking them here covers all templates at once rather than relying on
 * spotting each one by eye.
 */

const theme = useThemeStore.getState().getActiveTheme()
const fontPreset = useThemeStore.getState().getActiveFontPreset()

/** A resume long enough to force pagination in every template. */
function longResume(templateId: string): Resume {
  const base = createSampleResume(templateId)
  const bullets = [
    'Led a team of 4 designers and 12 engineers to launch a self-serve onboarding flow, reducing time-to-value from 14 days to 3 days.',
    'Defined and drove the pricing strategy for a new tier, growing net revenue retention from 98% to 112% within two quarters.',
    'Partnered with sales and support leadership to build a customer feedback loop that now informs every quarterly roadmap.',
  ]
  return {
    ...base,
    experience: Array.from({ length: 8 }, (_, i) => ({
      ...base.experience[0],
      id: `exp-${i}`,
      role: `Senior Product Manager ${i + 1}`,
      company: `Northwind Systems ${i + 1}`,
      bullets: bullets.map((text, j) => ({ id: `b-${i}-${j}`, text })),
      visible: true,
    })),
    education: Array.from({ length: 3 }, (_, i) => ({
      ...base.education[0], id: `edu-${i}`, visible: true,
    })),
  }
}

/** Depth-first walk yielding every node with its absolute page coordinates. */
function walk(nodes: LayoutNode[], offsetX = 0, offsetY = 0): { node: LayoutNode; x: number; y: number }[] {
  const out: { node: LayoutNode; x: number; y: number }[] = []
  for (const node of nodes) {
    const x = offsetX + node.xPt
    const y = offsetY + node.yPt
    out.push({ node, x, y })
    if (node.children.length) out.push(...walk(node.children, x, y))
  }
  return out
}

/** Banner headers deliberately bleed past the text column; nothing else may. */
const BLEED_TOLERANCE = 12

/**
 * Two-column templates paint a sidebar to the page edge and run their two
 * columns side by side, so "inside the text column" and "sections never
 * overlap vertically" are single-column properties by definition. They still
 * have to stay on the sheet and size their sections to their content, which is
 * asserted for every template below.
 */
const isSingleColumn = (layout: string) => layout === 'single-column'

function describePage(page: LayoutPage): string {
  return `page ${page.pageNumber}`
}

describe('template catalog layout', () => {
  it('registers a renderer for every template (none fall back)', () => {
    // The fallback renderer produces a generic sheet, so a template silently
    // missing its registration would still "work" while looking wrong.
    const unregistered = ALL_TEMPLATES.filter((tpl) => {
      const tree = templateRenderer.render(createSampleResume(tpl.id), tpl, theme, fontPreset)
      return tree.templateId !== tpl.id
    })
    expect(unregistered.map((t) => t.id)).toEqual([])
  })

  it('has unique ids and names', () => {
    const ids = ALL_TEMPLATES.map((t) => t.id)
    const names = ALL_TEMPLATES.map((t) => t.name)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  it('ships exactly forty production templates', () => {
    expect(ALL_TEMPLATES).toHaveLength(40)
  })

  it('keeps retired templates resolvable for existing resumes', () => {
    for (const id of ['cadence']) {
      expect(getTemplateById(id)?.id).toBe(id)
      expect(ALL_TEMPLATES.some((template) => template.id === id)).toBe(false)
    }
  })

  it('gives every template its own design', () => {
    // Two templates differing only in palette read as the same template. The
    // page structure, header, and section-header treatments shape the design;
    // palette and font swaps alone must never count as a new layout.
    const seen = new Map<string, string>()
    const duplicates: string[] = []
    for (const [id, spec] of registeredSpecs()) {
      const design = spec.editorial
        ? `${JSON.stringify(spec.editorial)} + ${spec.sectionHeader}`
        : `${spec.body ?? 'single'} + ${spec.header} + ${spec.sectionHeader}`
      const owner = seen.get(design)
      if (owner) duplicates.push(`${id} repeats ${owner}'s design (${design})`)
      else seen.set(design, id)
    }
    expect(duplicates).toEqual([])
  })

  it('covers both categories', () => {
    const byCategory = ALL_TEMPLATES.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1
      return acc
    }, {})
    expect(byCategory.Fresher).toBeGreaterThan(0)
    expect(byCategory.Experienced).toBeGreaterThan(0)
  })

  it.each(ALL_TEMPLATES)('keeps the default A4 sample on one complete page: $name', (tpl) => {
      const tree = templateRenderer.render(createSampleResume(tpl.id), tpl, theme, fontPreset)
      expect(tree.pages, `${tpl.name} strands sample content on another page`).toHaveLength(1)
      const sections = tree.pages[0].nodes.filter(node => node.type === 'section')
      expect(sections.map(node => node.sectionType)).toEqual(expect.arrayContaining([
        'summary', 'experience', 'education', 'skills', 'projects', 'certifications',
      ]))
  })

  it('uses bundled font weights so exported typography does not fall back', () => {
    for (const tpl of ALL_TEMPLATES) {
      const tree = templateRenderer.render(createSampleResume(tpl.id), tpl, theme, fontPreset)
      for (const { node } of tree.pages.flatMap(page => walk(page.nodes))) {
        if (node.type !== 'text' || !node.content) continue
        expect(() => fontRegistry.getFontPath(node.styles.fontFamily, node.styles.fontWeight),
          `${tpl.name}: ${node.styles.fontFamily}-${node.styles.fontWeight}`).not.toThrow()
      }
    }
  })

  it('renders pale sidebar fills from the same palette as the appearance inspector', () => {
    for (const id of ['northstar', 'canvas', 'juniper', 'studio', 'vellum']) {
      const tpl = getTemplateById(id)!
      const tree = templateRenderer.render(createSampleResume(id), tpl, theme, fontPreset)
      const panel = tree.pages[0].nodes.find(node => node.type === 'rect' && node.heightPt === tree.pages[0].heightPt)!
      const colors = getTemplateColorConfiguration(id).defaults
      expect(panel.styles.backgroundColor).toBe(colors.panelBackground)
      expect(panel.styles.backgroundColor).not.toBe(colors.accent)
    }
  })

  it('keeps long names, headlines and contact details clear of the first sections', () => {
    for (const tpl of ALL_TEMPLATES) {
      const resume = createSampleResume(tpl.id)
      resume.personalInfo.fullName = 'Alexandra Catherine Morgan-Williams'
      resume.personalInfo.headline = 'Senior Product and Customer Experience Manager'
      resume.personalInfo.email = 'alexandra.catherine.morgan.williams@example.com'
      const tree = templateRenderer.render(resume, tpl, theme, fontPreset)
      if (tpl.id === 'fresher-sidebar-photo') {
        const headline = tree.pages[0].nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'headline')!
        // This headline takes three lines at actual word boundaries in the
        // narrow sidebar; character-count division incorrectly reserved two.
        expect(headline.heightPt).toBeGreaterThanOrEqual(headline.styles.fontSize * headline.styles.lineHeight * 3)
      }
      if (tpl.id === 'studio') {
        const name = tree.pages[0].nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'fullName')!
        const headline = tree.pages[0].nodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'headline')!
        // The monogram narrows this nameplate enough to require three lines.
        expect(name.heightPt).toBeGreaterThanOrEqual(name.styles.fontSize * name.styles.lineHeight * 3)
        expect(headline.yPt).toBeGreaterThanOrEqual(name.yPt + name.heightPt)
      }
      for (const page of tree.pages) {
        const headers = page.nodes.filter(node => node.type === 'text' && node.content)
        for (const header of headers) {
          const required = estimateStyledTextHeight(header.content!, header.widthPt, header.styles.fontSize,
            header.styles.lineHeight, header.styles.letterSpacing ?? 0, header.styles.fontFamily, header.styles.fontWeight)
          expect(header.heightPt, `${tpl.name}: ${header.content}`).toBeGreaterThanOrEqual(required - 0.5)
          for (const section of page.nodes.filter(node => node.type === 'section')) {
            const sameColumn = header.xPt < section.xPt + section.widthPt && header.xPt + header.widthPt > section.xPt
            if (sameColumn) expect(header.yPt + header.heightPt, `${tpl.name}: header overlaps ${section.sectionType}`)
              .toBeLessThanOrEqual(section.yPt + 0.5)
          }
        }
      }
    }
  })

  it('makes every built-in section heading editable in every template', () => {
    for (const tpl of ALL_TEMPLATES) {
      const resume = createSampleResume(tpl.id)
      resume.sectionTitles = {
        summary: 'My Story',
        experience: 'Career History',
        education: 'Learning',
        skills: 'Strengths',
        projects: 'Selected Work',
        certifications: 'Credentials',
      }
      const tree = templateRenderer.render(resume, tpl, theme, fontPreset)
      const nodes = tree.pages.flatMap((page) => walk(page.nodes).map(({ node }) => node))

      for (const [sectionType, title] of Object.entries(resume.sectionTitles)) {
        const heading = nodes.find((node) =>
          node.editRef?.kind === 'section-title'
          && node.editRef.sectionType === sectionType
          && node.content?.toLowerCase() === title.toLowerCase()
        )
        expect(heading, `${tpl.id} is missing an editable ${sectionType} heading`).toBeDefined()
      }

    }
  })

  it('applies section title, border, and description colors while matching heading icons to titles', () => {
    const foundation = ALL_TEMPLATES.find((template) => template.id === 'fresher-sidebar-photo')!
    const foundationResume = createSampleResume(foundation.id)
    foundationResume.templateColors = {
      sectionTitle: '#123456',
      sectionBorder: '#234567',
      sectionDescription: '#345678',
      panelText: '#fefefe',
    }
    const foundationNodes = templateRenderer
      .render(foundationResume, foundation, theme, fontPreset)
      .pages.flatMap((page) => walk(page.nodes).map(({ node }) => node))

    expect(foundationNodes.find((node) =>
      node.editRef?.kind === 'section-title' && node.editRef.sectionType === 'summary'
    )?.styles.color).toBe('#123456')
    expect(foundationNodes.find((node) => node.type === 'divider')?.styles.color).toBe('#234567')
    expect(foundationNodes.find((node) => node.editRef?.kind === 'summary')?.styles.color).toBe('#345678')
    expect(foundationNodes.find((node) =>
      node.type === 'icon' && node.panelTarget === 'personal-info'
    )?.styles.color).toBe('#fefefe')

    const clarity = ALL_TEMPLATES.find((template) => template.id === 'experienced-icon-minimal')!
    const clarityResume = createSampleResume(clarity.id)
    clarityResume.templateColors = { sectionTitle: '#456789', sectionIcon: '#abcdef' }
    clarityResume.sectionIcons = { experience: 'rocket' }
    const clarityNodes = templateRenderer
      .render(clarityResume, clarity, theme, fontPreset)
      .pages.flatMap((page) => walk(page.nodes).map(({ node }) => node))

    expect(clarityNodes.find((node) => node.type === 'icon')?.styles.color).toBe('#456789')
    expect(clarityNodes.some((node) =>
      node.type === 'icon' && node.iconName === 'rocket' && node.iconEditable === true
    )).toBe(true)
  })

  for (const tpl of ALL_TEMPLATES) {
    describe(`${tpl.name} (${tpl.id})`, () => {
      for (const [label, resume] of [
        ['short resume', createSampleResume(tpl.id)],
        ['long resume', longResume(tpl.id)],
      ] as const) {
        describe(label, () => {
          const tree = templateRenderer.render(resume, tpl, theme, fontPreset)

          it('produces at least one page with content', () => {
            expect(tree.pages.length).toBeGreaterThan(0)
            expect(tree.pages[0].nodes.length).toBeGreaterThan(0)
          })

          it('keeps every node inside the printable width', () => {
            if (!isSingleColumn(tpl.layout)) return
            for (const page of tree.pages) {
              const left = page.marginsPt.left - BLEED_TOLERANCE
              const right = page.widthPt - page.marginsPt.right + BLEED_TOLERANCE
              for (const { node, x } of walk(page.nodes)) {
                // Full-bleed bands (sidebar panels, footer strips) are drawn to
                // the page edge on purpose; the text inside them is still checked.
                if (node.type === 'rect' && x <= 0.5 && node.widthPt >= page.widthPt - 0.5) continue
                expect(
                  x, `${describePage(page)} ${node.type} starts left of the text column`
                ).toBeGreaterThanOrEqual(left)
                expect(
                  x + node.widthPt, `${describePage(page)} ${node.type} runs past the right margin`
                ).toBeLessThanOrEqual(right + 0.5)
              }
            }
          })

          it('stays within the page horizontally', () => {
            for (const page of tree.pages) {
              for (const { node, x } of walk(page.nodes)) {
                // Decorative full-bleed art (Spectrum's diagonal frame) is drawn
                // deliberately past the trim edge; only content must stay on the sheet.
                if (node.type === 'rect' && node.rotationDeg) continue
                expect(x, `${describePage(page)} ${node.type} starts off the left edge`).toBeGreaterThanOrEqual(-0.5)
                expect(
                  x + node.widthPt, `${describePage(page)} ${node.type} runs off the right edge`
                ).toBeLessThanOrEqual(page.widthPt + 0.5)
              }
            }
          })

          it('never runs a node off the bottom of the sheet', () => {
            for (const page of tree.pages) {
              for (const { node, y } of walk(page.nodes)) {
                expect(
                  y + node.heightPt, `${describePage(page)} ${node.type} overflows the page`
                ).toBeLessThanOrEqual(page.heightPt + 0.5)
              }
            }
          })

          it('starts all content below the top margin', () => {
            if (!isSingleColumn(tpl.layout)) return
            for (const page of tree.pages) {
              for (const { node, y } of walk(page.nodes)) {
                expect(
                  y, `${describePage(page)} ${node.type} starts above the top margin`
                ).toBeGreaterThanOrEqual(page.marginsPt.top - BLEED_TOLERANCE)
              }
            }
          })

          it('does not overlap sibling sections', () => {
            if (!isSingleColumn(tpl.layout)) return
            for (const page of tree.pages) {
              const sections = page.nodes
                .filter((n) => n.type === 'section')
                .sort((a, b) => a.yPt - b.yPt)
              for (let i = 1; i < sections.length; i++) {
                const prev = sections[i - 1]
                const cur = sections[i]
                expect(
                  cur.yPt,
                  `${describePage(page)} "${cur.sectionType}" overlaps "${prev.sectionType}"`
                ).toBeGreaterThanOrEqual(prev.yPt + prev.heightPt - 0.5)
              }
            }
          })

          it('gives every text node room for the lines it will wrap to', () => {
            // The failure this catches is a heading declared one line tall
            // that actually wraps to two: nothing clips, so the next block
            // simply renders on top of it.
            for (const page of tree.pages) {
              for (const { node } of walk(page.nodes)) {
                if (node.type !== 'text' || !node.content) continue
                const needed = estimateStyledTextHeight(
                  node.content, node.widthPt, node.styles.fontSize, node.styles.lineHeight,
                  node.styles.letterSpacing ?? 0, node.styles.fontFamily, node.styles.fontWeight
                )
                expect(
                  node.heightPt,
                  `${describePage(page)} text "${node.content.slice(0, 40)}" wraps past its box`
                ).toBeGreaterThanOrEqual(needed - 0.5)
              }
            }
          })

          it('sizes each section to contain its own children', () => {
            for (const page of tree.pages) {
              for (const section of page.nodes.filter((n) => n.type === 'section')) {
                const deepest = walk(section.children)
                  .reduce((max, { node, y }) => Math.max(max, y + node.heightPt), 0)
                expect(
                  section.heightPt,
                  `${describePage(page)} "${section.sectionType}" clips its content`
                ).toBeGreaterThanOrEqual(deepest - 0.5)
              }
            }
          })
        })
      }
    })
  }
})
