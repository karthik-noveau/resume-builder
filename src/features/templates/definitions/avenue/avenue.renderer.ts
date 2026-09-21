import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'avenue',
  createTemplateRenderer({
    id: 'avenue',
    headingFamily: 'Manrope',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 29,
      headline: 11.5,
      sectionTitle: 10,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8,
    },
    marginMm: 19,
    header: 'rule',
    sectionHeader: 'plain',
    density: 'roomy',
    uppercaseName: true,
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Professional Profile',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
