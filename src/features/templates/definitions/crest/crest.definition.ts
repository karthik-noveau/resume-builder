import type { TemplateDefinition } from '@/shared/types/template.types'

export const crestDefinition: TemplateDefinition = {
  id: 'crest',
  designStyle: 'Simple',
  name: 'Crest',
  category: 'Experienced',
  version: 1,
  description:
    'A deep navy identity column balanced by crisp serif headings and a spacious white main column.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['executive', 'navy', 'sidebar', 'serif'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
