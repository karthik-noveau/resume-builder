import { describe, it, expect } from 'vitest'
import type { LayoutNode, LayoutPage, LayoutStyles, LayoutTree } from '@/shared/types/layout.types'
import type { Resume } from '@/shared/types/resume.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { ResumeStyleOverrides } from '@/shared/types/style.types'
import { applyStyleOverrides, toRoleTypography, withRoleTypography } from './style.overrides'
import { annotateStyleTargets } from './style.roles'

const BASE_STYLE: LayoutStyles = {
  fontFamily: 'Inter',
  fontSize: 10,
  fontWeight: 400,
  color: '#111111',
  lineHeight: 1.4,
  textAlign: 'left',
}

let counter = 0
function node(partial: Partial<LayoutNode>): LayoutNode {
  return {
    id: `n${++counter}`,
    type: 'text',
    xPt: 0,
    yPt: 0,
    widthPt: 300,
    heightPt: 14,
    styles: { ...BASE_STYLE },
    children: [],
    ...partial,
  }
}

function page(nodes: LayoutNode[]): LayoutPage {
  return {
    pageNumber: 1,
    widthPt: 595.28,
    heightPt: 841.89,
    marginsPt: { top: 40, right: 40, bottom: 40, left: 40 },
    nodes,
  }
}

function tree(nodes: LayoutNode[]): LayoutTree {
  return {
    resumeId: 'r1',
    templateId: 't1',
    themeId: 'light',
    fontPresetId: 'professional',
    pageSize: 'A4',
    pages: [page(nodes)],
  }
}

function resumeWith(styleOverrides?: ResumeStyleOverrides): Resume {
  return { id: 'r1', styleOverrides } as unknown as Resume
}

describe('style target keys', () => {
  it('addresses an element by the field it renders, not by render order', () => {
    const before = [
      node({ content: 'Alex', editRef: { kind: 'personal-info', field: 'fullName' } }),
      node({ content: 'Engineer', editRef: { kind: 'personal-info', field: 'headline' } }),
    ]
    // The same two fields after an unrelated edit renumbered every node id.
    counter = 500
    const after = [
      node({ content: 'Alex', editRef: { kind: 'personal-info', field: 'fullName' } }),
      node({ content: 'Engineer', editRef: { kind: 'personal-info', field: 'headline' } }),
    ]

    annotateStyleTargets([page(before)])
    annotateStyleTargets([page(after)])

    expect(before[0].id).not.toBe(after[0].id)
    expect(after[0].styleKey).toBe(before[0].styleKey)
    expect(after[1].styleKey).toBe(before[1].styleKey)
  })

  it('keeps an un-reffed element addressable by its position inside its entry', () => {
    const entry = node({
      type: 'entry',
      editRef: { kind: 'entry', sectionType: 'experience', entryId: 'exp-1' },
      children: [
        node({ content: 'Engineer', editRef: { kind: 'entry-field', sectionType: 'experience', entryId: 'exp-1', field: 'role' } }),
        node({ content: '2020 – Present', yPt: 0 }),
      ],
    })
    annotateStyleTargets([page([entry])])

    expect(entry.children[1].styleKey).toBe('entry:experience:exp-1/text#1')
    // Dates sit in the small text style, which is where the templates put them.
    expect(entry.children[1].styleRole).toBe('small')
  })

  it('classifies a job title as an entry title and a bullet as body', () => {
    const entry = node({
      type: 'entry',
      editRef: { kind: 'entry', sectionType: 'experience', entryId: 'exp-1' },
      children: [
        node({ editRef: { kind: 'entry-field', sectionType: 'experience', entryId: 'exp-1', field: 'role' } }),
        node({ type: 'bullet', content: 'Shipped a thing' }),
      ],
    })
    annotateStyleTargets([page([entry])])

    expect(entry.children[0].styleRole).toBe('entryTitle')
    expect(entry.children[1].styleRole).toBe('body')
  })
})

describe('text styles (role tier)', () => {
  it('maps a role onto the font-preset scale key it owns', () => {
    const result = toRoleTypography({ roles: { body: { fontSize: 12 }, contact: { fontSize: 8 } } })
    expect(result?.scale).toEqual({ body: 12, caption: 8 })
  })

  it('routes a heading role to the heading family and a text role to the body family', () => {
    const result = toRoleTypography({
      roles: { sectionTitle: { fontFamily: 'Manrope' }, body: { fontFamily: 'SourceSerifPro' } },
    })
    expect(result?.headingFamily).toBe('Manrope')
    expect(result?.bodyFamily).toBe('SourceSerifPro')
  })

  it('leaves the preset untouched when nothing is overridden', () => {
    const fp = { id: 'professional' } as FontPreset
    expect(withRoleTypography(fp, undefined)).toBe(fp)
    expect(withRoleTypography(fp, { elements: { 'summary:text': { color: '#ff0000' } } })).toBe(fp)
  })

  it('paints a role but does not re-apply its size, which already went through the preset', () => {
    const name = node({
      content: 'Alex',
      editRef: { kind: 'personal-info', field: 'fullName' },
      // A template rendering the name at 1.15x the role's own scale.
      styles: { ...BASE_STYLE, fontSize: 23 },
    })
    applyStyleOverrides(
      tree([name]),
      resumeWith({ roles: { name: { fontSize: 20, color: '#aa0000' } } }),
    )

    expect(name.styles.color).toBe('#aa0000')
    expect(name.styles.fontSize).toBe(23)
  })
})

describe('element overrides', () => {
  it('applies an element override over its text style', () => {
    const summary = node({ content: 'Hello', editRef: { kind: 'summary' } })
    applyStyleOverrides(tree([summary]), resumeWith({
      roles: { body: { color: '#333333' } },
      elements: { 'summary:text': { color: '#0000ff', fontSize: 14 } },
    }))

    expect(summary.styles.color).toBe('#0000ff')
    expect(summary.styles.fontSize).toBe(14)
  })

  it('rewrites content for a letter-case change so the export matches the canvas', () => {
    const heading = node({
      content: 'Experience',
      editRef: { kind: 'section-title', sectionType: 'experience', defaultValue: 'Experience' },
    })
    applyStyleOverrides(tree([heading]), resumeWith({
      roles: { sectionTitle: { textTransform: 'uppercase' } },
    }))

    expect(heading.content).toBe('EXPERIENCE')
  })

  it('paints a page background as a full-bleed rect behind everything', () => {
    const t = tree([node({ content: 'Alex' })])
    applyStyleOverrides(t, resumeWith({ page: { backgroundColor: '#fdf6e3' } }))

    const first = t.pages[0].nodes[0]
    expect(first.type).toBe('rect')
    expect(first.styles.backgroundColor).toBe('#fdf6e3')
    expect(first.widthPt).toBe(t.pages[0].widthPt)
    expect(first.heightPt).toBe(t.pages[0].heightPt)
  })
})

describe('flow repair', () => {
  it('pushes what sits below an element that grew', () => {
    const grown = node({ content: 'Summary line', editRef: { kind: 'summary' }, yPt: 100, heightPt: 14 })
    const below = node({ content: 'Next block', yPt: 120 })
    applyStyleOverrides(tree([grown, below]), resumeWith({
      elements: { 'summary:text': { fontSize: 30 } },
    }))

    expect(grown.heightPt).toBeGreaterThan(14)
    expect(below.yPt).toBeGreaterThan(120)
  })

  it('leaves a same-row sibling in place when only one side grew', () => {
    const entry = node({
      type: 'entry',
      editRef: { kind: 'entry', sectionType: 'experience', entryId: 'exp-1' },
      heightPt: 40,
      children: [
        node({
          content: 'Senior Engineer',
          widthPt: 210,
          yPt: 0,
          heightPt: 14,
          editRef: { kind: 'entry-field', sectionType: 'experience', entryId: 'exp-1', field: 'role' },
        }),
        // The dates column, sharing the title's baseline.
        node({ content: '2020 – Present', xPt: 210, widthPt: 90, yPt: 0, heightPt: 14 }),
      ],
    })
    applyStyleOverrides(tree([entry]), resumeWith({
      elements: { 'field:experience:exp-1:role': { fontSize: 22 } },
    }))

    expect(entry.children[1].yPt).toBe(0)
  })

  it('does not move anything when no override changes a height', () => {
    const first = node({ content: 'Alex', editRef: { kind: 'personal-info', field: 'fullName' }, yPt: 40 })
    const second = node({ content: 'Engineer', yPt: 60 })
    applyStyleOverrides(tree([first, second]), resumeWith({
      elements: { 'personal:fullName': { color: '#ff0000' } },
    }))

    expect(first.heightPt).toBe(14)
    expect(second.yPt).toBe(60)
  })
})
