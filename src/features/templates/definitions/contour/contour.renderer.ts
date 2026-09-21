import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'contour',
  createTemplateRenderer({
    id: 'contour',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 40,
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
      photo: 'arch',
      side: 'left',
      treatment: 'frame',
      panelWidth: 0.34,
      paper: true,
      skillStyle: 'bars',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
