import type { TemplateDefinition } from '@/shared/types/template.types'

export const strataDefinition: TemplateDefinition = {
  id: 'strata',
  designStyle: 'Ultra Modern',
  name: 'Strata',
  category: 'Experienced',
  version: 1,
  description:
    'Poster-sized typography, a circular portrait, numbered sections, and an electric-lilac credentials block.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['type poster', 'circle', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
