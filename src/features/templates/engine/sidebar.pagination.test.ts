import { describe, it, expect } from 'vitest'
import { ALL_TEMPLATES, templateRenderer } from '../registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { AVAILABLE_THEMES, AVAILABLE_FONT_PRESETS } from '@/shared/stores/theme.store'
import type { Resume } from '@/shared/types/resume.types'
import type { LayoutNode, LayoutPage } from '@/shared/types/layout.types'

const theme = AVAILABLE_THEMES.find((t) => t.id === 'light')!
const fp = AVAILABLE_FONT_PRESETS[0]

/** Pads experience until the resume is guaranteed to span several pages. */
function multiPageResume(templateId: string): Resume {
  const r = createSampleResume(templateId)
  const base = r.experience[0]
  r.experience = Array.from({ length: 8 }, (_, i) => ({
    ...base,
    id: `exp-${i}`,
    company: `Company Number ${i}`,
    role: `Senior Engineering Manager ${i}`,
    description: Array.from({ length: 6 }, (_, j) =>
      `Bullet ${j} for role ${i}: delivered a substantial cross-functional programme that measurably improved retention, revenue and operational efficiency across several teams.`
    ),
  }))
  return r
}

function flatten(node: LayoutNode, out: LayoutNode[] = []): LayoutNode[] {
  out.push(node)
  for (const c of node.children) flatten(c, out)
  return out
}

const nodesOf = (page: LayoutPage) => page.nodes.flatMap((n) => flatten(n))

/** A partial-width, full-height panel, not the full-page paper background. */
function sidebarPanel(page: LayoutPage): LayoutNode | undefined {
  return nodesOf(page).find(
    (n) => n.type === 'rect' && n.heightPt >= page.heightPt * 0.9 && n.widthPt > 40 && n.widthPt < page.widthPt * 0.55
  )
}

/** Relative luminance, used to spot light-on-dark text that lost its backing. */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0.5
  const n = parseInt(m[1], 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

describe('sidebar templates across page breaks', () => {
  const sidebarTemplates = ALL_TEMPLATES.filter((tpl) => {
    const tree = templateRenderer.render(createSampleResume(tpl.id), tpl, theme, fp)
    return !!sidebarPanel(tree.pages[0])
  })

  it('reports how many sidebar templates are in the catalog', () => {
    expect(sidebarTemplates.length).toBeGreaterThan(0)
  })

  for (const tpl of sidebarTemplates) {
    describe(tpl.name, () => {
      const tree = templateRenderer.render(multiPageResume(tpl.id), tpl, theme, fp)

      it('spans more than one page (fixture sanity check)', () => {
        expect(tree.pages.length).toBeGreaterThan(1)
      })

      it('paints the sidebar panel on every page', () => {
        const missing = tree.pages.filter((p) => !sidebarPanel(p)).map((p) => p.pageNumber)
        expect(missing).toEqual([])
      })

      it('never leaves light sidebar text on a page with no panel', () => {
        const stranded = tree.pages.flatMap((page) => {
          const panel = sidebarPanel(page)
          if (panel) return []
          const columnW = tree.pages[0].widthPt * 0.4
          return nodesOf(page)
            .filter((n) => n.type === 'text' && n.content && n.xPt < columnW && luminance(n.styles.color) > 0.75)
            .map((n) => `p${page.pageNumber}:${n.content?.slice(0, 24)}`)
        })
        expect(stranded).toEqual([])
      })

      it('places every sidebar-column section on the first page', () => {
        // A section is "in the sidebar" by position, not by type — which types
        // live in the sidebar differs per template, but the x offset does not.
        // With this fixture only experience is expanded. Unchanged, short
        // sidebar sections must not be delayed by the other column's overflow.
        const panel = sidebarPanel(tree.pages[0])!
        const sidebarSectionsOn = (page: LayoutPage) =>
          nodesOf(page)
            .filter((n) => n.type === 'section' && n.xPt >= panel.xPt && n.xPt + n.widthPt <= panel.xPt + panel.widthPt)
            .map((n) => n.sectionType)

        const onFirst = new Set(sidebarSectionsOn(tree.pages[0]))
        const strandedLater = tree.pages
          .slice(1)
          .flatMap((p) => sidebarSectionsOn(p).map((s) => `p${p.pageNumber}:${s}`))
          .filter((s) => !onFirst.has(s.split(':')[1] as never))

        expect(strandedLater).toEqual([])
        expect(onFirst.size).toBeGreaterThan(0)
      })
    })
  }
})
