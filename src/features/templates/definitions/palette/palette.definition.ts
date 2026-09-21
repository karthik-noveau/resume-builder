import type { TemplateDefinition } from '@/shared/types/template.types'

export const paletteDefinition: TemplateDefinition = {
  id: 'palette',
  designStyle: 'Ultra Modern',
  name: 'Palette',
  category: 'Fresher',
  version: 1,
  description:
    'A coral portrait crown and midnight sidebar pair with bold section ribbons and graphical skill ratings.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait rail', 'rounded', 'portrait', 'bold', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
