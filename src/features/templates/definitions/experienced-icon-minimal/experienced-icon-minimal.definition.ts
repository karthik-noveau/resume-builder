import type { TemplateDefinition } from '@/shared/types/template.types'

export const experiencedIconMinimalDefinition: TemplateDefinition = {
  id: 'experienced-icon-minimal',
  name: 'Clarity',
  category: 'Experienced',
  version: 1,
  description: 'Clean single-column layout with icon-labeled sections — built for seasoned professionals.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'minimal', 'single-column', 'professional'],
  layout: 'single-column',
  exportRules: { includeProfileImage: true, forceBlackText: false },
}
