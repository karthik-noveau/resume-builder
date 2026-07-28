import type { TemplateDefinition } from '@/shared/types/template.types'

export const northstarDefinition: TemplateDefinition = {
  id: 'northstar',
  name: 'Northstar',
  category: 'Fresher',
  version: 1,
  description: 'Centred nameplate with airy spacing — a confident first resume that never looks thin.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['fresher', 'entry-level', 'airy', 'clean'],
  layout: 'two-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
