import type { TemplateDefinition } from '@/shared/types/template.types'

export const solsticeDefinition: TemplateDefinition = {
  id: 'solstice',
  designStyle: 'Simple',
  name: 'Solstice',
  category: 'Fresher',
  version: 1,
  description:
    'A warm, centered introduction with sand-colored section bands and generous breathing room.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['graduate', 'warm', 'centered', 'professional'],
  layout: 'single-column',
  exportRules: {
    includeProfileImage: false,
    forceBlackText: false,
  },
}
