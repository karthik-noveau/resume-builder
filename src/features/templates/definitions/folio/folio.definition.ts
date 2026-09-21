import type { TemplateDefinition } from '@/shared/types/template.types'

export const folioDefinition: TemplateDefinition = {
  id: 'folio',
  designStyle: 'Simple',
  name: 'Folio',
  category: 'Experienced',
  version: 1,
  description: 'An editorial serif nameplate, burgundy accents, and fine horizontal rules.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['editorial', 'serif', 'creative', 'leadership'],
  layout: 'single-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
