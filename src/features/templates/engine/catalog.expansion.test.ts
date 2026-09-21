import { describe, expect, it } from 'vitest'
import { ALL_TEMPLATES, getTemplateById, templateRenderer } from '../registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { registeredSpecs } from './template.kit'

const theme = useThemeStore.getState().getActiveTheme()
const font = useThemeStore.getState().getActiveFontPreset()
const parallelColumns = ALL_TEMPLATES.filter(
  (template) => template.designStyle === 'Ultra Modern'
).map((template) => template.id)
const flatten = (nodes: LayoutNode[]): LayoutNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children)])

describe('expanded template collection', () => {
  it('offers exactly twenty Simple and twenty genuinely Ultra Modern designs', () => {
    const simple = ALL_TEMPLATES.filter((template) => template.designStyle === 'Simple')
    const modern = ALL_TEMPLATES.filter((template) => template.designStyle === 'Ultra Modern')
    expect(simple).toHaveLength(20)
    expect(modern).toHaveLength(20)
    expect(new Set([...simple, ...modern].map((template) => template.id)).size).toBe(40)
    for (const template of modern) {
      expect(registeredSpecs().get(template.id)!.editorial, template.id).toBeDefined()
      expect(template.exportRules.includeProfileImage, template.id).toBe(true)
    }
    for (const template of simple) {
      expect(registeredSpecs().get(template.id)?.editorial, template.id).toBeUndefined()
    }
    expect(
      new Set(modern.map((template) => registeredSpecs().get(template.id)!.editorial!.family)).size
    ).toBe(5)
  })

  it('balances the forty designs across both experience levels', () => {
    expect(ALL_TEMPLATES.filter((template) => template.category === 'Fresher')).toHaveLength(20)
    expect(ALL_TEMPLATES.filter((template) => template.category === 'Experienced')).toHaveLength(20)
  })

  for (const id of parallelColumns) {
    for (const pageSize of ['A4', 'LETTER'] as const) {
      it(`${id} paginates both columns independently on ${pageSize}`, () => {
        const resume = createSampleResume(id)
        resume.settings.pageSize = pageSize
        const indexedCredentials = id === 'vector'
        if (indexedCredentials)
          resume.certifications = Array.from({ length: 25 }, (_, index) => ({
            ...resume.certifications[0],
            id: `certification-${index}`,
            title: `Credential ${index}`,
          }))
        else
          resume.education = Array.from({ length: 25 }, (_, index) => ({
            ...resume.education[0],
            id: `education-${index}`,
            institution: `University ${index}`,
          }))
        resume.experience = Array.from({ length: 8 }, (_, index) => ({
          ...resume.experience[0],
          id: `experience-${index}`,
          role: `Product Manager ${index}`,
        }))
        const tree = templateRenderer.render(resume, getTemplateById(id)!, theme, font)
        const nodes = tree.pages.flatMap((page) => flatten(page.nodes))
        expect(tree.pages.length).toBeGreaterThan(1)
        expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length)
        // Overflow in the credentials column must not move the main column to
        // the last page or drop entries in either column.
        const firstPage = flatten(tree.pages[0].nodes)
        expect(
          firstPage.some(
            (node) => node.editRef?.kind === 'entry' && node.editRef.entryId === 'experience-0'
          )
        ).toBe(true)
        expect(
          firstPage.some(
            (node) =>
              node.editRef?.kind === 'entry' &&
              node.editRef.entryId === (indexedCredentials ? 'certification-0' : 'education-0')
          )
        ).toBe(true)
        const entries = nodes.flatMap((node) =>
          node.editRef?.kind === 'entry' ? [node.editRef.entryId] : []
        )
        expect(entries).toEqual(
          expect.arrayContaining([
            ...resume.experience.map((entry) => entry.id),
            ...resume.education.map((entry) => entry.id),
            ...resume.certifications.map((entry) => entry.id),
          ])
        )
        expect(new Set(entries).size).toBe(entries.length)
        for (const page of tree.pages) {
          for (const section of page.nodes.filter((node) => node.type === 'section')) {
            expect(section.yPt + section.heightPt).toBeLessThanOrEqual(
              page.heightPt - page.marginsPt.bottom + 0.5
            )
          }
        }
      })
    }
  }

  for (const id of ['strata', 'archive', 'linear', 'dossier']) {
    it(`${id} keeps long section labels clear of entry hit areas`, () => {
      const resume = createSampleResume(id)
      resume.sectionTitles = { experience: 'Professional Experience and Leadership' }
      const tree = templateRenderer.render(resume, getTemplateById(id)!, theme, font)
      for (const section of tree.pages
        .flatMap((page) => page.nodes)
        .filter((node) => node.type === 'section')) {
        const label = section.children.find((node) => node.editRef?.kind === 'section-title')
        if (!label) continue
        for (const entry of section.children.filter((node) => node.type === 'entry')) {
          expect(label.yPt + label.heightPt).toBeLessThanOrEqual(entry.yPt)
          expect(entry.xPt + entry.widthPt).toBeLessThanOrEqual(section.widthPt)
        }
      }
      const text = tree.pages
        .flatMap((page) => flatten(page.nodes))
        .map((node) => node.content)
        .join(' ')
      expect(text.toUpperCase()).toContain('PROFESSIONAL EXPERIENCE AND LEADERSHIP')
    })
  }
})
