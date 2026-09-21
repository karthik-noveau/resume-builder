import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'aster',
  createTemplateRenderer({
    id: 'aster',
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
    sectionHeader: 'outline-label',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'split-editorial',
      photo: 'arch',
      side: 'right',
      treatment: 'cutout',
      paper: true,
      panelWidth: 0.42,
      skillStyle: 'bars',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
