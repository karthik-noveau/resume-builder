import type { TemplateDefinition } from '@/shared/types/template.types'

export const ledgerDefinition: TemplateDefinition = {
  id: 'ledger',
  name: 'Ledger',
  category: 'Experienced',
  version: 1,
  description: 'Name and contact split across a shared baseline, with quiet boxed section labels.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['experienced', 'finance', 'structured', 'split'],
  layout: 'single-column',
  exportRules: { includeProfileImage: false, forceBlackText: false },
}
