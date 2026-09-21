import type { TemplateDefinition } from '@/shared/types/template.types'

export const meridianDefinition: TemplateDefinition = {
  id: 'meridian',
  designStyle: 'Simple',
  name: 'Meridian',
  category: 'Experienced',
  version: 2,
  description: 'A centred serif nameplate, muted sage accents and balanced editorial spacing.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'consulting', 'banking', 'classic'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
