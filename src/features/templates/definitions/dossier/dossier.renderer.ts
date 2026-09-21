import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'dossier',
  createTemplateRenderer({
    id: 'dossier',
    headingFamily: 'IBMPlexSans',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 54,
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
    sectionHeader: 'outline-label',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'type-poster',
      photo: 'circle',
      side: 'left',
      treatment: 'frame',
      panelTone: 'light',
      panelWidth: 0.35,
      skillStyle: 'dots',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
