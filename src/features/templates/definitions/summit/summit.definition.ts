import type { TemplateDefinition } from '@/shared/types/template.types'

export const summitDefinition: TemplateDefinition = {
  id: 'summit',
  designStyle: 'Ultra Modern',
  name: 'Summit',
  category: 'Experienced',
  version: 1,
  description:
    'An offset arched portrait, commanding two-line name, and mint-accented career timeline with icon-led sections.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['type poster', 'arch', 'portrait', 'bold', 'editorial', 'bars'],
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
