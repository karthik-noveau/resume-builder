import type { TemplateDefinition } from '@/shared/types/template.types'

export const cadenceDefinition: TemplateDefinition = {
  id: 'cadence',
  designStyle: 'Simple',
  name: 'Cadence',
  category: 'Experienced',
  version: 1,
  description: 'Dark header band with a portrait, a grey contact rail and a timeline down the experience column.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'icons', 'friendly', 'clear'],
  layout: 'two-column',
  sectionIcons: {
    summary: 'user',
    experience: 'briefcase',
    education: 'graduation-cap',
    skills: 'sliders',
    projects: 'folder',
    certifications: 'award',
    custom: 'message-circle',
  },
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
