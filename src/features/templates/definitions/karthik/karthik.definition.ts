import type { TemplateDefinition } from '@/shared/types/template.types'

export const karthikDefinition: TemplateDefinition = {
  id: 'karthik',
  name: 'Karthik',
  category: 'Fresher',
  designStyle: 'Simple',
  version: 1,
  description: 'A spacious portrait header, neatly grouped contact details and light serif headings, with subtle blue icons.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['portrait', 'serif headings', 'blue icons', 'graduate', 'single column'],
  layout: 'single-column',
  sectionIcons: {
    summary: 'user', education: 'graduation-cap', experience: 'briefcase',
    skills: 'settings', projects: 'code', certifications: 'award', custom: 'shield',
  },
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
