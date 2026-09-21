import type { TemplateDefinition } from '@/shared/types/template.types'

export const harborDefinition: TemplateDefinition = {
  id: 'harbor',
  designStyle: 'Simple',
  name: 'Harbor',
  category: 'Experienced',
  version: 1,
  description:
    'A precise split header with cool teal details and an understated technical character.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['technical', 'engineering', 'split-header', 'minimal'],
  layout: 'single-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
