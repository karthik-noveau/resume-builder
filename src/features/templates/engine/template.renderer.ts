import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import { LayoutBuilder } from './layout.builder'
import { renderHeader, renderSectionSingleColumn } from './section.renderers'

export type TemplateRenderFn = (
  resume: Resume,
  template: TemplateDefinition,
  theme: Theme,
  fontPreset: FontPreset
) => LayoutTree

const renderers = new Map<string, TemplateRenderFn>()

export function registerRenderer(templateId: string, fn: TemplateRenderFn): void {
  renderers.set(templateId, fn)
}

export class TemplateRenderer {
  render(
    resume: Resume,
    template: TemplateDefinition,
    theme: Theme,
    fontPreset: FontPreset
  ): LayoutTree {
    const fn = renderers.get(template.id)
    if (fn) return fn(resume, template, theme, fontPreset)
    return this.renderFallback(resume, template, theme, fontPreset)
  }

  private renderFallback(
    resume: Resume,
    template: TemplateDefinition,
    theme: Theme,
    fp: FontPreset
  ): LayoutTree {
    const builder = new LayoutBuilder({
      resumeId: resume.id,
      templateId: template.id,
      themeId: theme.id,
      fontPresetId: fp.id,
      pageSize: resume.settings.pageSize,
      marginMm: 15,
    })

    const forceBlack = template.exportRules.forceBlackText
    const c = {
      builder, theme, fp,
      forceBlack,
      singleColumn: true,
      uppercase: false,
    }

    renderHeader(c, resume.personalInfo)

    for (const sectionType of resume.sectionOrder) {
      renderSectionSingleColumn(c, sectionType, resume)
    }

    return builder.build()
  }
}

export const templateRenderer = new TemplateRenderer()
