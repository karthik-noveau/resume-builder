import type { TemplateDefinition } from '@/shared/types/template.types'

export const graphiteDefinition: TemplateDefinition = {
  id: 'graphite',
  name: 'Graphite',
  category: 'Fresher',
  version: 1,
  description: 'Monochrome and compact, with boxed labels that survive any printer.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'monochrome', 'compact', 'print'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
