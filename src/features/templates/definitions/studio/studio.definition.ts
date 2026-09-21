import type { TemplateDefinition } from '@/shared/types/template.types'

export const studioDefinition: TemplateDefinition = {
  id: 'studio',
  designStyle: 'Simple',
  name: 'Studio',
  category: 'Fresher',
  version: 1,
  description:
    'A compact monogram, muted lavender sidebar, and refined section markers for creative careers.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['creative', 'monogram', 'sidebar', 'design'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
