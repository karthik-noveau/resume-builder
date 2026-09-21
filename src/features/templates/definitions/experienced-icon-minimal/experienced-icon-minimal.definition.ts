import type { TemplateDefinition } from '@/shared/types/template.types'

export const experiencedIconMinimalDefinition: TemplateDefinition = {
  id: 'experienced-icon-minimal',
  designStyle: 'Simple',
  name: 'Clarity',
  category: 'Experienced',
  version: 2,
  description: 'Refined typography, subtle icons and fine rules in an easy-to-scan single column.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'minimal', 'single-column', 'professional'],
  layout: 'single-column',
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
