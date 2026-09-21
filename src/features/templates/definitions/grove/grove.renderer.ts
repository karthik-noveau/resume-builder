import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'grove',
  createTemplateRenderer({
    id: 'grove',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 30,
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
    sectionHeader: 'editorial-rule',
    density: 'compact',
    uppercaseSectionTitles: false,
    editorial: {
      family: 'portrait-rail',
      photo: 'arch',
      side: 'left',
      treatment: 'rule',
      paper: true,
      panelTone: 'light',
      panelWidth: 0.36,
      skillStyle: 'bars',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
