import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('graphite', createTemplateRenderer({
  id: 'graphite',
  headingFamily: 'IBMPlexSans',
  bodyFamily: 'IBMPlexSans',
  defaultScale: { name: 30, headline: 11.5, sectionTitle: 9.5, entryTitle: 11, body: 10, small: 9, caption: 8 },
  defaultLineHeight: { heading: 1.2, body: 1.45 },
  marginMm: 18,
  header: 'monogram',
  sectionHeader: 'plain',
  density: 'regular',
  uppercaseSectionTitles: true,
  titles: { summary: 'About Me', experience: 'Experience' },
}))
