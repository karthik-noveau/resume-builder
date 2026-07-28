import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('cornerstone', createTemplateRenderer({
  id: 'cornerstone',
  accent: '#111827',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'SourceSerifPro',
  ink: '#111827',
  muted: '#4b5563',
  rule: '#d1d5db',
  marginMm: 19,
  header: 'rule',
  sectionHeader: 'caps-rule',
  density: 'roomy',
  uppercaseName: true,
  uppercaseSectionTitles: true,
  titles: { summary: 'Profile', experience: 'Experience' },
}))
