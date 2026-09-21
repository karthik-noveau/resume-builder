import type { TemplateDefinition } from '@/shared/types/template.types'

export const bylineDefinition: TemplateDefinition = {
  id: 'byline',
  designStyle: 'Ultra Modern',
  name: 'Byline',
  category: 'Experienced',
  version: 1,
  description:
    'An oversized serif identity and generous portrait above a magazine-style two-column story with fine rules.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['split editorial', 'rounded', 'portrait', 'serif', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
