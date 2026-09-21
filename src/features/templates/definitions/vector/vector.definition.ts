import type { TemplateDefinition } from '@/shared/types/template.types'

export const vectorDefinition: TemplateDefinition = {
  id: 'vector',
  designStyle: 'Ultra Modern',
  name: 'Vector',
  category: 'Fresher',
  version: 1,
  description:
    'Oversized black typography, a circular portrait, and a rounded dark profile column with cobalt highlights.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['type poster', 'circle', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
