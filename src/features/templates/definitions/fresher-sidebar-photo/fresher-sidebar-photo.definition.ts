import type { TemplateDefinition } from '@/shared/types/template.types'

export const fresherSidebarPhotoDefinition: TemplateDefinition = {
  id: 'fresher-sidebar-photo',
  designStyle: 'Simple',
  name: 'Foundation',
  category: 'Fresher',
  version: 2,
  description: 'Deep navy, crisp typography and generous gutters for a polished first impression.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'entry-level', 'sidebar', 'photo'],
  layout: 'two-column',
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
