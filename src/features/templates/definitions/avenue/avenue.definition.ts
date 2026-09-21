import type { TemplateDefinition } from '@/shared/types/template.types'

export const avenueDefinition: TemplateDefinition = {
  id: 'avenue',
  designStyle: 'Simple',
  name: 'Avenue',
  category: 'Experienced',
  version: 1,
  description:
    'A sharply framed name, monochrome typography, and open sections with no visual clutter.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['minimal', 'monochrome', 'consulting', 'classic'],
  layout: 'single-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
