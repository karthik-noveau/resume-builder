import type { TemplateDefinition } from '@/shared/types/template.types'

export const contourDefinition: TemplateDefinition = {
  id: 'contour',
  designStyle: 'Ultra Modern',
  name: 'Contour',
  category: 'Experienced',
  version: 1,
  description:
    'An arched portrait and inset sand credentials column connect through strong architectural rules on warm paper.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['architect grid', 'arch', 'portrait', 'serif', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
