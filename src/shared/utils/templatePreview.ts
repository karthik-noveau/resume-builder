import type { LayoutTree } from '@/shared/types/layout.types'
import { getTemplateById, templateRenderer } from '@/features/templates/registry/template.registry'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'
import { TEMPLATE_PORTRAIT_ID } from './templatePortrait'

const cache = new Map<string, LayoutTree>()

/**
 * Renders a template against realistic sample data (not a specific user's
 * resume) for use in template pickers — memoized since the template catalog
 * and sample content are both static.
 */
export function getTemplatePreviewTree(templateId: string): LayoutTree | null {
  const theme = useThemeStore.getState().getActiveTheme()
  const fontPreset = useThemeStore.getState().getActiveFontPreset()
  const cacheKey = `${templateId}:${theme.id}:${fontPreset.id}`

  const cached = cache.get(cacheKey)
  if (cached) return cached

  const template = getTemplateById(templateId)
  if (!template) return null

  const sample = createSampleResume(templateId)
  if (template.exportRules.includeProfileImage) {
    sample.personalInfo.profileImage = TEMPLATE_PORTRAIT_ID
    sample.settings.showProfileImage = true
  }
  const tree = templateRenderer.render(sample, template, theme, fontPreset)
  cache.set(cacheKey, tree)
  return tree
}
