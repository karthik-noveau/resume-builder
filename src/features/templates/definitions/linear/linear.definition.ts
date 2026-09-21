import type { TemplateDefinition } from '@/shared/types/template.types'

export const linearDefinition: TemplateDefinition = {
  id: 'linear',
  designStyle: 'Ultra Modern',
  name: 'Linear',
  category: 'Experienced',
  version: 1,
  description:
    'A monochrome typographic poster with a compact portrait, fine grid lines, and violet details.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['type poster', 'circle', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
