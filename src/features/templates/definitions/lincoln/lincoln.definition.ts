import type { TemplateDefinition } from '@/shared/types/template.types'

export const lincolnDefinition: TemplateDefinition = {
  id: 'lincoln',
  designStyle: 'Ultra Modern',
  name: 'Lincoln',
  category: 'Experienced',
  version: 1,
  description:
    'A golden portrait ribbon and light-gray credentials rail, with sharp black typography and dot-rated skills.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait rail', 'arch', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
