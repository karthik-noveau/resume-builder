import type { TemplateDefinition } from '@/shared/types/template.types'

export const cornerstoneDefinition: TemplateDefinition = {
  id: 'cornerstone',
  name: 'Cornerstone',
  category: 'Fresher',
  version: 1,
  description: 'Rule-framed name and caps section labels, set roomy — formal enough for law and finance internships.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'formal', 'internship', 'classic'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
