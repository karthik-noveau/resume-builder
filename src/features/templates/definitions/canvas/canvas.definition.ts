import type { TemplateDefinition } from '@/shared/types/template.types'

export const canvasDefinition: TemplateDefinition = {
  id: 'canvas',
  designStyle: 'Simple',
  name: 'Canvas',
  category: 'Fresher',
  version: 2,
  description: 'An expressive serif nameplate with a warm ivory sidebar and quiet terracotta accents.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'portfolio', 'design', 'spacious'],
  layout: 'two-column',
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
