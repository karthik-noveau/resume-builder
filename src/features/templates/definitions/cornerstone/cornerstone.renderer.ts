import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('cornerstone', createTemplateRenderer({
  id: 'cornerstone',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'SourceSerifPro',
  defaultScale: { name: 29, headline: 11.5, sectionTitle: 10, entryTitle: 11, body: 10, small: 9, caption: 8.5 },
  defaultLineHeight: { heading: 1.2, body: 1.45 },
  marginMm: 19,
  header: 'rule',
  sectionHeader: 'caps-rule',
  density: 'roomy',
  uppercaseName: true,
  uppercaseSectionTitles: true,
  titles: { summary: 'Profile', experience: 'Experience' },
}))
