import type { TemplateDefinition } from '@/shared/types/template.types'

export const axisDefinition: TemplateDefinition = {
  id: 'axis',
  designStyle: 'Simple',
  name: 'Axis',
  category: 'Fresher',
  version: 1,
  description:
    'A structured career timeline with small section icons and clean blue-gray typography.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['technical', 'timeline', 'icons', 'modern'],
  layout: 'single-column',
  sectionIcons: {
    summary: 'user',
    experience: 'briefcase',
    education: 'graduation-cap',
    skills: 'zap',
    projects: 'folder',
    certifications: 'award',
  },
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
