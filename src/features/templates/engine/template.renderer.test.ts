import { describe, it, expect, vi } from 'vitest'
import { TemplateRenderer, registerRenderer } from './template.renderer'
import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutNode } from '@/shared/types/layout.types'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer()

  const mockResume = {
    id: '1',
    settings: { pageSize: 'A4' },
    sectionOrder: ['summary'],
    personalInfo: { fullName: 'John' },
    summary: { visible: true, content: 'Hello' }
  } as unknown as Resume

  const mockTemplateData = {
    id: 'test-template',
    name: 'Test Template',
    version: 1,
    description: 'Test Description',
    thumbnail: '',
    layout: 'single-column' as const,
  category: 'ATS',
    exportRules: {
      forceBlackText: false,
      includeProfileImage: true,
    },
  } as unknown
  const mockTemplate = mockTemplateData as TemplateDefinition

  const mockThemeData = {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#1a73e8',
      primaryHover: '#1557b0',
      primaryActive: '#1c447d',
      background: '#f8f9fa',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      textPrimary: '#1a1c1e',
      textSecondary: '#44474e',
      textMuted: '#74777f',
      success: '#1e8e3e',
      warning: '#f9ab00',
      error: '#d93025',
      info: '#1a73e8',
      accent: '#e8f0fe',
      divider: '#dee1e6',
    },
  } as unknown
  const mockTheme = mockThemeData as Theme

  const mockFontPresetData = {
    id: 'professional',
    name: 'Professional',
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    scale: {
      name: 24,
      headline: 13,
      sectionTitle: 11,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8,
    },
    lineHeight: {
      heading: 1.2,
      body: 1.5,
    },
    letterSpacing: {
      heading: 0,
      body: 0,
    },
  } as unknown
  const mockFontPreset = mockFontPresetData as FontPreset

  it('renders a resume using the fallback renderer if no specific renderer is registered', () => {
    const layoutTree = renderer.render(mockResume, mockTemplate, mockTheme, mockFontPreset)
    expect(layoutTree).toBeDefined()
    expect(layoutTree.templateId).toBe('test-template')
  })

  it('renders using a registered renderer', () => {
    const customRender = vi.fn().mockReturnValue({ custom: true })
    registerRenderer('custom-template', customRender)

    const templateWithCustom = { ...mockTemplate, id: 'custom-template' }
    const result = renderer.render(mockResume, templateWithCustom, mockTheme, mockFontPreset)

    expect(customRender).toHaveBeenCalled()
    expect(result).toEqual({ custom: true })
  })

  describe('editRef tagging (fallback renderer)', () => {
    function flattenNodes(nodes: LayoutNode[]): LayoutNode[] {
      return nodes.flatMap((n) => [n, ...flattenNodes(n.children)])
    }

    it('tags the personal-info, summary, and entry fields it supports inline editing for', () => {
      const resume = createEmptyResume('unregistered-template-for-fallback')
      const layoutTree = renderer.render(resume, mockTemplate, mockTheme, mockFontPreset)
      const allNodes = flattenNodes(layoutTree.pages.flatMap((p) => p.nodes))

      const fullNameNode = allNodes.find((n) => n.editRef?.kind === 'personal-info' && n.editRef.field === 'fullName')
      expect(fullNameNode?.content).toBe(resume.personalInfo.fullName.toUpperCase())

      const summaryNode = allNodes.find((n) => n.editRef?.kind === 'summary')
      expect(summaryNode?.content).toBe(resume.summary.content)

      const firstExperience = resume.experience[0]
      const roleNode = allNodes.find(
        (n) => n.editRef?.kind === 'entry-field' && n.editRef.sectionType === 'experience' && n.editRef.field === 'role'
      )
      expect(roleNode?.editRef).toMatchObject({ entryId: firstExperience.id })

      const entryWrapper = allNodes.find((n) => n.editRef?.kind === 'entry' && n.editRef.entryId === firstExperience.id)
      expect(entryWrapper).toBeDefined()
      expect(entryWrapper?.type).toBe('entry')
    })

    it('does not tag decorative or joined/derived text with an editRef', () => {
      const resume = createEmptyResume('unregistered-template-for-fallback')
      const layoutTree = renderer.render(resume, mockTemplate, mockTheme, mockFontPreset)
      const allNodes = flattenNodes(layoutTree.pages.flatMap((p) => p.nodes))

      const dividers = allNodes.filter((n) => n.type === 'divider')
      expect(dividers.length).toBeGreaterThan(0)
      expect(dividers.every((n) => n.editRef === undefined)).toBe(true)

      // The experience date range is a joined "start – end" string, not a raw single field — out of scope.
      const firstExperience = resume.experience[0]
      const dateLineNode = allNodes.find((n) => n.content?.includes(firstExperience.startDate) && n.content.includes('–'))
      expect(dateLineNode?.editRef).toBeUndefined()
    })
  })
})
