import type { TemplateDefinition } from '@/shared/types/template.types'

export const signalDefinition: TemplateDefinition = {
  id: 'signal',
  designStyle: 'Ultra Modern',
  name: 'Signal',
  category: 'Fresher',
  version: 1,
  description:
    'A golden crown and circular portrait over a charcoal rail, with bold icon badges and a connected career timeline.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait rail', 'circle', 'portrait', 'bold', 'editorial', 'bars'],
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
