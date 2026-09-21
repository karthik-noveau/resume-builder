import type { TemplateDefinition } from '@/shared/types/template.types'

export const mosaicDefinition: TemplateDefinition = {
  id: 'mosaic',
  designStyle: 'Ultra Modern',
  name: 'Mosaic',
  category: 'Fresher',
  version: 1,
  description:
    'A deep olive portrait rail, bright chartreuse frame, and icon-led sections create a graphic creative résumé.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait rail', 'rounded', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  sectionIcons: {
    summary: 'user',
    experience: 'briefcase',
    education: 'graduation-cap',
    skills: 'zap',
    projects: 'folder',
    certifications: 'award',
  },
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
