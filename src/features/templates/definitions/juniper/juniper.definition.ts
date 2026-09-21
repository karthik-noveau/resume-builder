import type { TemplateDefinition } from '@/shared/types/template.types'

export const juniperDefinition: TemplateDefinition = {
  id: 'juniper',
  designStyle: 'Simple',
  name: 'Juniper',
  category: 'Fresher',
  version: 1,
  description: 'A pale sage side column, centered introduction, and gently ruled section headings.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['graduate', 'sage', 'sidebar', 'balanced'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
