import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'summit',
  createTemplateRenderer({
    id: 'summit',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 53,
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
    sectionHeader: 'badge',
    density: 'compact',
    uppercaseSectionTitles: true,
    timeline: true,
    editorial: {
      family: 'type-poster',
      photo: 'arch',
      side: 'left',
      treatment: 'rule',
      panelTone: 'light',
      panelWidth: 0.34,
      skillStyle: 'bars',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
