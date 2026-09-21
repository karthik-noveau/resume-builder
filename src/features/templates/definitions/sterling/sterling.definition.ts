import type { TemplateDefinition } from '@/shared/types/template.types'

export const sterlingDefinition: TemplateDefinition = {
  id: 'sterling',
  designStyle: 'Simple',
  name: 'Sterling',
  category: 'Experienced',
  version: 1,
  description:
    'A centered serif masthead and quiet, open sections for a timeless executive résumé.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['executive', 'serif', 'classic', 'minimal'],
  layout: 'single-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
