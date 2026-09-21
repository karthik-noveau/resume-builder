import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'vector',
  createTemplateRenderer({
    id: 'vector',
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 61,
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
    sectionHeader: 'plain',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'type-poster',
      photo: 'circle',
      side: 'right',
      treatment: 'frame',
      panelTone: 'dark',
      panelWidth: 0.4,
      panelShape: 'rounded',
      paper: true,
      skillStyle: 'dots',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
