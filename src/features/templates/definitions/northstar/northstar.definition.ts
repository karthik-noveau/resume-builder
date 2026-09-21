import type { TemplateDefinition } from '@/shared/types/template.types'

export const northstarDefinition: TemplateDefinition = {
  id: 'northstar',
  designStyle: 'Simple',
  name: 'Northstar',
  category: 'Fresher',
  version: 2,
  description: 'A soft sage sidebar, clean sans-serif type and clearly organised supporting details.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'entry-level', 'airy', 'clean'],
  layout: 'two-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
