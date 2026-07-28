import type { TemplateDefinition } from '@/shared/types/template.types'

export const experiencedSidebarLogoDefinition: TemplateDefinition = {
  id: 'experienced-sidebar-logo',
  name: 'Monogram',
  category: 'Experienced',
  version: 1,
  description: 'Bold color sidebar with a monogram mark, built for quantified, metrics-driven experience.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'sidebar', 'two-column', 'bold'],
  layout: 'two-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
