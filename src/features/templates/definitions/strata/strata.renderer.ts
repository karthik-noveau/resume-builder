import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'strata',
  createTemplateRenderer({
    id: 'strata',
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 66,
      headline: 11,
      sectionTitle: 11,
      entryTitle: 10.5,
      body: 9.5,
      small: 8.5,
      caption: 8,
    },
    defaultLineHeight: { heading: 1.2, body: 1.4 },
    marginMm: 15,
    body: 'columns-right',
    header: 'stacked',
    sectionHeader: 'numbered',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'type-poster',
      photo: 'circle',
      side: 'right',
      treatment: 'cutout',
      panelTone: 'light',
      panelWidth: 0.33,
      skillStyle: 'dots',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
