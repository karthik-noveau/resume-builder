import type { TemplateDefinition } from '@/shared/types/template.types'

export const experiencedSidebarLogoDefinition: TemplateDefinition = {
  id: 'experienced-sidebar-logo',
  designStyle: 'Simple',
  name: 'Monogram',
  category: 'Experienced',
  version: 2,
  description: 'A forest-green sidebar and elegant serif nameplate, finished with a personal monogram.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'sidebar', 'two-column', 'bold'],
  layout: 'two-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
