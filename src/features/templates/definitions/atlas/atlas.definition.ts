import type { TemplateDefinition } from '@/shared/types/template.types'

export const atlasDefinition: TemplateDefinition = {
  id: 'atlas',
  designStyle: 'Simple',
  name: 'Atlas',
  category: 'Experienced',
  version: 2,
  description: 'A tailored navy header with precise alignment and understated section markers.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'senior', 'bold', 'banner'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
