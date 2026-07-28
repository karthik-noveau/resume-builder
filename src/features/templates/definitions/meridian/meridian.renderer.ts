import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('meridian', createTemplateRenderer({
  id: 'meridian',
  accent: '#1e3a5f',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'SourceSerifPro',
  ink: '#111827',
  muted: '#4b5563',
  rule: '#d1d5db',
  marginMm: 18,
  header: 'centered',
  sectionHeader: 'caps-rule',
  density: 'regular',
  uppercaseName: true,
  uppercaseSectionTitles: true,
  titles: { summary: 'Profile', experience: 'Professional Experience', skills: 'Skills & Tools' },
}))
