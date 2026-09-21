import { describe, expect, it } from 'vitest'
import { ALL_TEMPLATES, templateRenderer } from '../registry/template.registry'
import { createEmptyResume, createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { TEMPLATE_PORTRAIT_ID } from '@/shared/utils/templatePortrait'
import type { LayoutNode } from '@/shared/types/layout.types'
import { registeredSpecs } from './template.kit'
import { loadTemplateFonts } from '@/tests/setup/templateFonts'

loadTemplateFonts()

const modern = ALL_TEMPLATES.filter((template) => template.designStyle === 'Ultra Modern')
const theme = useThemeStore.getState().getActiveTheme()
const font = useThemeStore.getState().getActiveFontPreset()
const flatten = (nodes: LayoutNode[]): LayoutNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children)])

describe('reference-inspired editorial templates', () => {
  it.each(modern)(
    '$name shows the uploaded photo only when enabled and preserves content',
    (template) => {
      const resume = createSampleResume(template.id)
      resume.personalInfo.profileImage = 'uploaded-photo'
      resume.settings.showProfileImage = true
      const tree = templateRenderer.render(resume, template, theme, font)
      expect(tree.pages).toHaveLength(1)
      const nodes = tree.pages.flatMap((page) => flatten(page.nodes))
      const photos = nodes.filter((node) => node.type === 'image')
      expect(photos).toHaveLength(1)
      expect(photos[0].imageId).toBe('uploaded-photo')
      expect(photos[0].clipShape).toBe(registeredSpecs().get(template.id)!.editorial!.photo)
      expect(
        nodes.some(
          (node) => node.editRef?.kind === 'summary' && node.content === resume.summary.content
        )
      ).toBe(true)
      for (const entry of [
        ...resume.experience,
        ...resume.education,
        ...resume.projects,
        ...resume.certifications,
      ]) {
        expect(
          nodes.some((node) => node.editRef?.kind === 'entry' && node.editRef.entryId === entry.id)
        ).toBe(true)
      }
      for (const page of tree.pages) {
        for (const section of page.nodes.filter((node) => node.type === 'section')) {
          expect(section.yPt + section.heightPt).toBeLessThanOrEqual(
            page.heightPt - page.marginsPt.bottom + 0.5
          )
          for (const other of page.nodes.filter(
            (node) => node.type === 'section' && node.id !== section.id
          )) {
            const horizontalOverlap =
              section.xPt < other.xPt + other.widthPt && section.xPt + section.widthPt > other.xPt
            if (horizontalOverlap && section.yPt <= other.yPt)
              expect(section.yPt + section.heightPt).toBeLessThanOrEqual(other.yPt + 0.5)
          }
        }
      }
      resume.settings.showProfileImage = false
      const hidden = templateRenderer.render(resume, template, theme, font)
      const hiddenPage = hidden.pages[0]
      const hiddenNodes = hidden.pages.flatMap(page => flatten(page.nodes))
      expect(
        hiddenNodes.filter((node) => node.type === 'image')
      ).toHaveLength(0)
      expect(hiddenNodes.some(node => node.content === 'AM')).toBe(false)
      const name = hiddenNodes.find(node => node.editRef?.kind === 'personal-info' && node.editRef.field === 'fullName')!
      const family = registeredSpecs().get(template.id)!.editorial!.family
      if (family === 'portrait-rail') {
        expect(name.yPt).toBe(hiddenPage.marginsPt.top)
      } else if (family === 'banner-columns') {
        const education = (items: LayoutNode[]) => items.find(node => node.sectionType === 'education')!
        expect(education(hiddenNodes).yPt).toBeLessThan(education(nodes).yPt)
      } else {
        expect(name.xPt).toBe(hiddenPage.marginsPt.left)
        expect(name.widthPt).toBe(hiddenPage.widthPt - hiddenPage.marginsPt.left - hiddenPage.marginsPt.right)
      }
      resume.settings.showProfileImage = true
      const restored = templateRenderer.render(resume, template, theme, font)
      expect(restored.pages.flatMap(page => flatten(page.nodes)).map(node => [node.type, node.content, node.xPt, node.yPt, node.widthPt, node.heightPt]))
        .toEqual(nodes.map(node => [node.type, node.content, node.xPt, node.yPt, node.widthPt, node.heightPt]))
    }
  )

  it('keeps the fictional portrait exclusive to template previews', () => {
    for (const template of modern) {
      expect(
        getTemplatePreviewTree(template.id)!
          .pages.flatMap((page) => flatten(page.nodes))
          .some((node) => node.imageId === TEMPLATE_PORTRAIT_ID)
      ).toBe(true)
      expect(createEmptyResume(template.id).personalInfo.profileImage).toBeUndefined()
      expect(createSampleResume(template.id).personalInfo.profileImage).toBeUndefined()
    }
  })

  it('never invents ratings for unranked skills', () => {
    const template = modern.find((template) => template.id === 'signal')!
    const resume = createSampleResume(template.id)
    resume.skills.forEach((group) => group.skills.forEach((skill) => delete skill.level))
    const tree = templateRenderer.render(resume, template, theme, font)
    for (const skills of tree.pages
      .flatMap((page) => page.nodes)
      .filter((node) => node.sectionType === 'skills')) {
      expect(
        flatten(skills.children).filter((node) => node.type === 'rect' && node.heightPt === 4)
      ).toHaveLength(0)
      expect(
        flatten(skills.children)
          .map((node) => node.content)
          .join(' ')
      ).toContain('Roadmapping')
    }
  })
})
