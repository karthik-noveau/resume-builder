import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import type { Theme } from '@/shared/types/theme.types'
import type { FontPreset } from '@/shared/types/font.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import { LayoutBuilder } from './layout.builder'
import { renderHeader, renderSectionSingleColumn } from './section.renderers'
import { applyResumeTypography } from './layout.utils'
import { applyStyleOverrides, withRoleTypography } from './style.overrides'
import { getProfileAvatar } from '@/shared/utils/profileAvatar'
import { applyProfileAvatarStyle } from './profileAvatar.layout'

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
    // Text-style sizes ride in on the preset so the template measures with
    // them; everything else is applied to the tree on the way out. Both happen
    // here rather than at each call site, so the canvas, the template previews
    // and the PDF export can never disagree about what the resume looks like.
    const fp = withRoleTypography(fontPreset, resume.styleOverrides)
    // Resolve a missing photo only for rendering; the sample must never replace
    // an uploaded asset or populate the user's otherwise blank personal data.
    const renderResume = template.exportRules.includeProfileImage && resume.settings.showProfileImage
      ? { ...resume, personalInfo: { ...resume.personalInfo, profileImage: resume.personalInfo.profileImage || getProfileAvatar(resume.settings.profileAvatarVariant, resume.settings.profileImageBackground).imageId } }
      : resume
    const fn = renderers.get(template.id)
    const tree = fn
      ? fn(renderResume, template, theme, fp)
      : this.renderFallback(renderResume, template, theme, applyResumeTypography(fp, resume.settings))
    return applyStyleOverrides(applyProfileAvatarStyle(tree, renderResume), resume)
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
      marginMm: resume.settings.margins ?? 15,
    })

    const forceBlack = template.exportRules.forceBlackText
    const c = {
      builder, theme, fp,
      forceBlack,
      singleColumn: true,
      uppercase: false,
    }

    renderHeader(c, resume.personalInfo)

    for (const sectionType of resume.sectionOrder.filter((type) => type !== 'custom')) {
      renderSectionSingleColumn(c, sectionType, resume)
    }

    return builder.build()
  }
}

export const templateRenderer = new TemplateRenderer()
