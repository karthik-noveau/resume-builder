import type { TemplateDefinition } from '@/shared/types/template.types'

export const graphiteDefinition: TemplateDefinition = {
  id: 'graphite',
  designStyle: 'Simple',
  name: 'Graphite',
  category: 'Fresher',
  version: 2,
  description: 'A restrained monogram, precise typography and a print-friendly graphite palette.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'monochrome', 'compact', 'print'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
