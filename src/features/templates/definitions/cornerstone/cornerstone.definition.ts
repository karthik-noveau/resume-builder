import type { TemplateDefinition } from '@/shared/types/template.types'

export const cornerstoneDefinition: TemplateDefinition = {
  id: 'cornerstone',
  designStyle: 'Simple',
  name: 'Cornerstone',
  category: 'Fresher',
  version: 2,
  description: 'Classic serif typography, warm charcoal and fine rules for a timeless formal layout.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'formal', 'internship', 'classic'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
