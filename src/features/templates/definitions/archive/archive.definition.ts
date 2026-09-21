import type { TemplateDefinition } from '@/shared/types/template.types'

export const archiveDefinition: TemplateDefinition = {
  id: 'archive',
  designStyle: 'Ultra Modern',
  name: 'Archive',
  category: 'Experienced',
  version: 1,
  description:
    'A portrait-led architectural grid with large serif typography, golden cross-rules, and carefully aligned columns.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['architect grid', 'rounded', 'portrait', 'serif', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
