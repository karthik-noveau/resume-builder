import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { getTemplateById, templateRenderer } from '@/features/templates/registry/template.registry'
import { AVAILABLE_FONT_PRESETS, resolveResumeTheme } from '@/shared/stores/theme.store'
import type { AppSettings } from '@/shared/types/resume.types'

type PreviewSettings = Pick<
  AppSettings,
  'themeId' | 'customPrimaryColor' | 'fontPresetId' | 'pageSize'
>

/** Use the editor's renderer and saved defaults without creating a stored resume. */
export function buildSettingsPreview(settings: PreviewSettings, templateId: string) {
  const template = getTemplateById(templateId)
  if (!template) return null
  const sample = createSampleResume(templateId, settings)
  const theme = resolveResumeTheme(settings.themeId, settings.customPrimaryColor)
  const font =
    AVAILABLE_FONT_PRESETS.find((preset) => preset.id === settings.fontPresetId) ??
    AVAILABLE_FONT_PRESETS[0]
  return templateRenderer.render(sample, template, theme, font)
}
