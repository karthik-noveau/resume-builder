import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'mosaic',
  createTemplateRenderer({
    id: 'mosaic',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 28,
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
    sectionHeader: 'badge',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'portrait-rail',
      photo: 'rounded',
      side: 'right',
      treatment: 'frame',
      panelTone: 'dark',
      panelWidth: 0.35,
      skillStyle: 'dots',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
