import { describe, expect, it } from 'vitest'
import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'
import { createEmptyResume, createSampleResume } from '@/features/resume/utils/resume.factory'
import { resumeSchema } from '@/shared/schemas/resume.schema'
import { applyMarginOverrides } from './style.margins'
import { applyStyleOverrides } from './style.overrides'
import { getTemplateById, templateRenderer } from '../registry/template.registry'
import { resolveResumeTheme, useThemeStore } from '@/shared/stores/theme.store'

function node(key: string, patch: Partial<LayoutNode> = {}): LayoutNode {
  return {
    id: key, styleKey: key, type: 'text', content: 'Short text', xPt: 0, yPt: 0, widthPt: 300, heightPt: 14,
    styles: { fontFamily: 'Inter', fontSize: 10, fontWeight: 400, lineHeight: 1.4, textAlign: 'left', color: '#000000' },
    children: [], ...patch,
  }
}

describe('element margins', () => {
  it('adds outer space and rewraps narrowed text without overlapping what follows', () => {
    const text = node('text', { content: 'A long paragraph with useful details about the person and their work.'.repeat(3), heightPt: 70 })
    const after = node('after', { yPt: 84 })
    applyMarginOverrides([text, after], {}, { text: { marginTopPt: 8, marginBottomPt: 12, marginLeftPt: 24, marginRightPt: 48 } })
    expect(text.xPt).toBe(24)
    expect(text.yPt).toBe(8)
    expect(text.widthPt).toBe(228)
    expect(text.heightPt).toBeGreaterThan(70)
    expect(after.yPt - text.yPt - text.heightPt).toBeCloseTo(14 + 12)
  })

  it('keeps columns independent and uses the larger growth when rows meet', () => {
    const left = node('left', { widthPt: 120 })
    const right = node('right', { xPt: 180, widthPt: 120 })
    const leftNext = node('left-next', { yPt: 24, widthPt: 120 })
    const rightNext = node('right-next', { xPt: 180, yPt: 24, widthPt: 120 })
    const full = node('full', { yPt: 50 })
    applyMarginOverrides([left, right, leftNext, rightNext, full], {}, {
      left: { marginBottomPt: 12 }, right: { marginBottomPt: 20 },
    })
    expect(leftNext.yPt).toBe(36)
    expect(rightNext.yPt).toBe(44)
    expect(full.yPt).toBe(70)
  })

  it('resizes nested sections and preserves child indents while pushing the following section', () => {
    const text = node('text', { xPt: 20, yPt: 10, widthPt: 280 })
    const entry = node('entry', { type: 'entry', heightPt: 24, children: [text] })
    const section = node('section', { type: 'section', yPt: 40, heightPt: 24, children: [entry] })
    const next = node('next', { type: 'section', yPt: 80 })
    applyMarginOverrides([section, next], {}, {
      section: { marginLeftPt: 30, marginRightPt: 30, marginTopPt: 10, marginBottomPt: 6 },
      text: { marginBottomPt: 8 },
    })
    expect(section).toMatchObject({ xPt: 30, yPt: 50, widthPt: 240, heightPt: 32 })
    expect(entry.widthPt).toBe(240)
    expect(text.xPt).toBe(16)
    expect(text.widthPt).toBe(224)
    expect(next.yPt).toBe(104)
  })

  it('supports rules, portraits, icons and decorative panels without distorting or growing the backdrop', () => {
    const line = node('line', { type: 'divider', heightPt: 1 })
    const after = node('after', { yPt: 20 })
    const photo = node('photo', { type: 'image', xPt: 400, widthPt: 60, heightPt: 60 })
    const icon = node('icon', { type: 'icon', xPt: 500, widthPt: 16, heightPt: 16 })
    const panel = node('panel', { type: 'rect', widthPt: 200, heightPt: 800 })
    applyMarginOverrides([panel, line, after, photo, icon], {}, {
      line: { marginLeftPt: 10, marginRightPt: 20, marginTopPt: 4, marginBottomPt: 6 },
      photo: { marginLeftPt: 6, marginRightPt: 6 },
      icon: { marginLeftPt: 2, marginRightPt: 2 },
      panel: { marginTopPt: 10, marginRightPt: 10, marginBottomPt: 20, marginLeftPt: 10 },
    })
    expect(line).toMatchObject({ xPt: 10, yPt: 4, widthPt: 270, heightPt: 1 })
    expect(after.yPt).toBe(30)
    expect(photo).toMatchObject({ widthPt: 48, heightPt: 48 })
    expect(icon).toMatchObject({ widthPt: 12, heightPt: 12 })
    expect(panel).toMatchObject({ xPt: 10, yPt: 10, widthPt: 180, heightPt: 770 })
  })

  it('inherits shared margins, allows a local zero and leaves an uncustomized layout untouched', () => {
    const first = node('first', { styleRole: 'body' })
    const second = node('second', { yPt: 24, styleRole: 'body' })
    applyMarginOverrides([first, second], { body: { marginTopPt: 8 } }, { first: { marginTopPt: 0 } })
    expect(first.yPt).toBe(0)
    expect(second.yPt).toBe(32)
    const untouched = [node('empty', { type: 'divider', heightPt: 0.5 })]
    const before = structuredClone(untouched)
    applyMarginOverrides(untouched, {}, { empty: { marginLeftPt: 0 } })
    expect(untouched).toEqual(before)
  })

  it('saves all four margins through import validation and never produces negative widths', () => {
    const resume = createEmptyResume('meridian')
    const style = { marginTopPt: 8, marginRightPt: 12, marginBottomPt: 16, marginLeftPt: 120 }
    resume.styleOverrides = { elements: { 'summary:text': style } }
    expect(resumeSchema.parse(resume).styleOverrides?.elements?.['summary:text']).toEqual(style)
    const text = node('text', { widthPt: 20 })
    applyMarginOverrides([text], {}, { text: style })
    expect(text.xPt).toBeGreaterThanOrEqual(0)
    expect(text.widthPt).toBeGreaterThan(0)
    expect(text.xPt + text.widthPt).toBeLessThanOrEqual(20)
    expect(resumeSchema.safeParse({ ...resume, styleOverrides: { elements: { text: { marginTopPt: -1 } } } }).success).toBe(false)
  })

  it.each(['experienced-icon-minimal', 'fresher-sidebar-photo', 'meridian'])('keeps content and style identities intact in %s', (templateId) => {
    const resume = createSampleResume(templateId)
    const render = () => templateRenderer.render(resume, getTemplateById(templateId)!, resolveResumeTheme(resume.themeId), useThemeStore.getState().getFontPresetById(resume.fontPresetId))
    const flatten = (tree: LayoutTree) => {
      const all: LayoutNode[] = []
      const visit = (nodes: LayoutNode[]) => nodes.forEach(n => { all.push(n); visit(n.children) })
      tree.pages.forEach(p => visit(p.nodes))
      return all
    }
    const before = flatten(render())
    resume.styleOverrides = { elements: { 'section:summary': { marginTopPt: 6, marginBottomPt: 6, marginLeftPt: 12, marginRightPt: 12 } } }
    const after = flatten(render())
    expect(after.map(n => [n.styleKey, n.content])).toEqual(before.map(n => [n.styleKey, n.content]))
    const first = before.find(n => n.styleKey === 'section:summary')!
    const changed = after.find(n => n.styleKey === 'section:summary')!
    expect(changed.xPt).toBe(first.xPt + 12)
    expect(changed.yPt).toBe(first.yPt + 6)
    expect(changed.widthPt).toBe(first.widthPt - 24)
  })

  it('applies margins after other styling in the shared render pass', () => {
    const text = node('name', { editRef: { kind: 'personal-info', field: 'fullName' } })
    const tree: LayoutTree = { resumeId: 'r', templateId: 't', themeId: 'light', fontPresetId: 'p', pageSize: 'A4', pages: [{ pageNumber: 1, widthPt: 595, heightPt: 842, marginsPt: { top: 40, right: 40, bottom: 40, left: 40 }, nodes: [text] }] }
    applyStyleOverrides(tree, { ...createEmptyResume('meridian'), styleOverrides: { elements: { 'personal:fullName': { fontSize: 20, marginLeftPt: 12, marginTopPt: 8 } } } })
    expect(text).toMatchObject({ xPt: 12, yPt: 8, widthPt: 288 })
    expect(text.styles.fontSize).toBe(20)
  })
})
