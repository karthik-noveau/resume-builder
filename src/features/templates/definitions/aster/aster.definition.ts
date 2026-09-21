import type { TemplateDefinition } from '@/shared/types/template.types'

export const asterDefinition: TemplateDefinition = {
  id: 'aster',
  designStyle: 'Ultra Modern',
  name: 'Aster',
  category: 'Fresher',
  version: 1,
  description:
    'A bold cream editorial with an oversized two-line name, arched portrait, and outlined section labels.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['split editorial', 'arch', 'portrait', 'bold', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
