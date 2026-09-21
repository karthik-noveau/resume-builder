import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer('meridian', createTemplateRenderer({
  id: 'meridian',
  headingFamily: 'SourceSerifPro',
  bodyFamily: 'Inter',
  defaultScale: {
    name: 34,
    headline: 11.5,
    sectionTitle: 10,
    entryTitle: 11,
    body: 10,
    small: 9,
    caption: 8,
  },
  defaultLineHeight: { heading: 1.2, body: 1.45 },
  marginMm: 18,
  header: 'centered',
  sectionHeader: 'caps-rule',
  density: 'roomy',
  uppercaseSectionTitles: true,
  titles: { summary: 'Profile', experience: 'Professional Experience', skills: 'Skills & Tools' },
}))
