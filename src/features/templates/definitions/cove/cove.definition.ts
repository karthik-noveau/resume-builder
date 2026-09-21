import type { TemplateDefinition } from '@/shared/types/template.types'

export const coveDefinition: TemplateDefinition = {
  id: 'cove',
  designStyle: 'Ultra Modern',
  name: 'Cove',
  category: 'Fresher',
  version: 1,
  description:
    'An airy centered masthead and dark contact strip above a right-side arched portrait column in coastal blue.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['banner columns', 'arch', 'portrait', 'bold', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
