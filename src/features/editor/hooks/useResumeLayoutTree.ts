import { useMemo } from 'react'
import { useTemplateStore } from '@/shared/stores/template.store'
import { useThemeStore, resolveResumeTheme } from '@/shared/stores/theme.store'
import { getTemplateById, templateRenderer } from '@/features/templates/registry/template.registry'
import type { Resume } from '@/shared/types/resume.types'
import type { LayoutTree } from '@/shared/types/layout.types'

/** Renders a resume's LayoutTree from its own saved template + theme/font, live-updating as the resume changes.
 * Resolves the template by `resume.templateId` (the resume's own source of truth), not the template
 * store's `activeTemplateId` — that field only tracks which template is highlighted in the picker UI
 * (Template Gallery / Appearance panel) and can be stale relative to whichever resume is actually open. */
export function useResumeLayoutTree(resume: Resume | null): LayoutTree | null {
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)
  const getFontPresetById = useThemeStore((s) => s.getFontPresetById)

  return useMemo(() => {
    if (!resume) return null
    const template = availableTemplates.find((t) => t.id === resume.templateId)
      ?? getTemplateById(resume.templateId)
    if (!template) return null
    const theme = resolveResumeTheme(resume.themeId, resume.customPrimaryColor)
    const fontPreset = getFontPresetById(resume.fontPresetId)
    return templateRenderer.render(resume, template, theme, fontPreset)
  }, [resume, availableTemplates, getFontPresetById])
}
