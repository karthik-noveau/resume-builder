import type { TemplateDefinition } from '@/shared/types/template.types'

export const orbitDefinition: TemplateDefinition = {
  id: 'orbit',
  designStyle: 'Ultra Modern',
  name: 'Orbit',
  category: 'Fresher',
  version: 1,
  description:
    'A large rounded portrait, oversized black name, and dark rounded profile column with warm amber highlights.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['split editorial', 'rounded', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
