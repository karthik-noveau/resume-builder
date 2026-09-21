import type { TemplateDefinition } from '@/shared/types/template.types'

export const atelierDefinition: TemplateDefinition = {
  id: 'atelier',
  designStyle: 'Ultra Modern',
  name: 'Atelier',
  category: 'Fresher',
  version: 1,
  description:
    'A blush editorial layout with a framed arch portrait, oversized name, and a soft inset profile column.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['split editorial', 'arch', 'portrait', 'bold', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
