import type { TemplateDefinition } from '@/shared/types/template.types'

export const groveDefinition: TemplateDefinition = {
  id: 'grove',
  designStyle: 'Ultra Modern',
  name: 'Grove',
  category: 'Fresher',
  version: 1,
  description:
    'A warm sand portrait rail and cream paper, with generous serif headings and understated skill bars.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait rail', 'arch', 'portrait', 'serif', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
