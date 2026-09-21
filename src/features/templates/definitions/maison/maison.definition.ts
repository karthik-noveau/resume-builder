import type { TemplateDefinition } from '@/shared/types/template.types'

export const maisonDefinition: TemplateDefinition = {
  id: 'maison',
  designStyle: 'Ultra Modern',
  name: 'Maison',
  category: 'Experienced',
  version: 1,
  description:
    'A sculptural portrait and oversized serif identity on rose paper, with fine editorial rules and open columns.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['split editorial', 'circle', 'portrait', 'serif', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
