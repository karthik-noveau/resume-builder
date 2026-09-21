import type { TemplateDefinition } from '@/shared/types/template.types'

export const horizonDefinition: TemplateDefinition = {
  id: 'horizon',
  designStyle: 'Ultra Modern',
  name: 'Horizon',
  category: 'Experienced',
  version: 1,
  description:
    'A wide typographic masthead, dark contact strip, and peach portrait column frame an open career story.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['banner columns', 'arch', 'portrait', 'bold', 'editorial', 'bars'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
