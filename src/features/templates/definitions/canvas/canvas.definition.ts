import type { TemplateDefinition } from '@/shared/types/template.types'

export const canvasDefinition: TemplateDefinition = {
  id: 'canvas',
  name: 'Canvas',
  category: 'Fresher',
  version: 1,
  description: 'Rule-framed nameplate and untitled whitespace — a portfolio-adjacent first resume.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'portfolio', 'design', 'spacious'],
  layout: 'two-column',
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
