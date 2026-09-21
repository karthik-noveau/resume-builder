import type { TemplateDefinition } from '@/shared/types/template.types'

export const vellumDefinition: TemplateDefinition = {
  id: 'vellum',
  designStyle: 'Simple',
  name: 'Vellum',
  category: 'Fresher',
  version: 1,
  description:
    'A soft ivory identity column and book-inspired typography with understated section labels.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['serif', 'ivory', 'sidebar', 'editorial'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
