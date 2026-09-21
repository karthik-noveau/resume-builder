import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'cove',
  createTemplateRenderer({
    id: 'cove',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 43,
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
      family: 'banner-columns',
      photo: 'arch',
      side: 'right',
      treatment: 'frame',
      panelTone: 'light',
      panelWidth: 0.34,
      paper: true,
      skillStyle: 'bars',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
