import type { TemplateDefinition } from '@/shared/types/template.types'

export const pinnacleDefinition: TemplateDefinition = {
  id: 'pinnacle',
  designStyle: 'Ultra Modern',
  name: 'Pinnacle',
  category: 'Experienced',
  version: 1,
  description:
    'A centered executive masthead, midnight contact strip, blue portrait column, and confident section ribbons.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['banner columns', 'circle', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
