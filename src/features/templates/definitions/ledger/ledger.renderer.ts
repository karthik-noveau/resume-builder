import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('ledger', createTemplateRenderer({
  id: 'ledger',
  accent: '#166534',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'Inter',
  ink: '#1f2937',
  muted: '#6b7280',
  rule: '#e5e7eb',
  band: '#f3f4f6',
  footerContact: true,
  marginMm: 16,
  header: 'split',
  sectionHeader: 'boxed',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'Profile', experience: 'Experience' },
}))
