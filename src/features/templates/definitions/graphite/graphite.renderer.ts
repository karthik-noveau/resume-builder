import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('graphite', createTemplateRenderer({
  id: 'graphite',
  accent: '#404040',
  headingFamily: 'IBMPlexSans',
  bodyFamily: 'IBMPlexSans',
  ink: '#171717',
  muted: '#404040',
  rule: '#d4d4d4',
  band: '#f5f5f5',
  marginMm: 15,
  header: 'monogram',
  sectionHeader: 'boxed',
  density: 'compact',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
