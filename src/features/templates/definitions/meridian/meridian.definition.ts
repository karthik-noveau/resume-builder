import type { TemplateDefinition } from '@/shared/types/template.types'

export const meridianDefinition: TemplateDefinition = {
  id: 'meridian',
  name: 'Meridian',
  category: 'Experienced',
  version: 1,
  description: 'Centred serif nameplate with rule-flanked section titles — the classic consulting and banking sheet.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'consulting', 'banking', 'classic'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
