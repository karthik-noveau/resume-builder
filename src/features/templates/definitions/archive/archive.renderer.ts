import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'archive',
  createTemplateRenderer({
    id: 'archive',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 39,
      headline: 11,
      sectionTitle: 11,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    defaultLineHeight: { heading: 1.2, body: 1.4 },
    marginMm: 15,
    body: 'columns-left',
    header: 'stacked',
    sectionHeader: 'caps-rule',
    density: 'compact',
    uppercaseSectionTitles: false,
    editorial: {
      family: 'architect-grid',
      photo: 'rounded',
      side: 'left',
      treatment: 'rule',
      panelWidth: 0.31,
      skillStyle: 'dots',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
