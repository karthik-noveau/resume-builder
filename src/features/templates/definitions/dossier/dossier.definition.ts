import type { TemplateDefinition } from '@/shared/types/template.types'

export const dossierDefinition: TemplateDefinition = {
  id: 'dossier',
  designStyle: 'Ultra Modern',
  name: 'Dossier',
  category: 'Fresher',
  version: 1,
  description:
    'A left-aligned portrait and oversized name lead a crisp editorial grid with forest accents and outlined labels.',
  thumbnail: '/thumbnails/placeholder.svg',
  tags: ['type poster', 'circle', 'portrait', 'bold', 'editorial', 'dots'],
  layout: 'two-column',
  exportRules: {
    includeProfileImage: true,
    forceBlackText: false,
  },
}
