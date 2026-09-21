import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'orbit',
  createTemplateRenderer({
    id: 'orbit',
    headingFamily: 'Inter',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 59,
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
    sectionHeader: 'plain',
    density: 'compact',
    uppercaseSectionTitles: true,
    editorial: {
      family: 'split-editorial',
      photo: 'rounded',
      side: 'left',
      treatment: 'frame',
      paper: true,
      panelTone: 'dark',
      panelWidth: 0.4,
      panelShape: 'rounded',
      skillStyle: 'dots',
      stackedName: true,
    },
    titles: { summary: 'Profile', experience: 'Experience', certifications: 'Credentials' },
  })
)
