import type { LayoutTree } from '@/shared/types/layout.types'
import { ALL_TEMPLATES, templateRenderer } from '@/features/templates/registry/template.registry'
import { createEmptyResume } from '@/features/resume/utils/resume.factory'
import { useThemeStore } from '@/shared/stores/theme.store'

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

  const template = ALL_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return null

  const tree = templateRenderer.render(createEmptyResume(templateId), template, theme, fontPreset)
  cache.set(cacheKey, tree)
  return tree
}
