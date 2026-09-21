import type { TemplateDefinition } from '@/shared/types/template.types'

export const ledgerDefinition: TemplateDefinition = {
  id: 'ledger',
  designStyle: 'Simple',
  name: 'Ledger',
  category: 'Experienced',
  version: 2,
  description: 'A split nameplate, warm neutral tones and softly framed section headings.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'finance', 'structured', 'split'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
