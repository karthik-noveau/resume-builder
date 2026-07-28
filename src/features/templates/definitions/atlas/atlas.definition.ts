import type { TemplateDefinition } from '@/shared/types/template.types'

export const atlasDefinition: TemplateDefinition = {
  id: 'atlas',
  name: 'Atlas',
  category: 'Experienced',
  version: 1,
  description: 'Full-width accent banner over a calm body — a confident opener for senior applications.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'senior', 'bold', 'banner'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
