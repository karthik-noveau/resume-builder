import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'pinnacle',
  createTemplateRenderer({
    id: 'pinnacle',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 42,
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
    sectionHeader: 'block-label',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'banner-columns',
      photo: 'circle',
      side: 'left',
      treatment: 'cutout',
      panelTone: 'light',
      panelWidth: 0.34,
      skillStyle: 'dots',
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
