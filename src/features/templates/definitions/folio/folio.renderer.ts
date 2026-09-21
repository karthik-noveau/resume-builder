import { createTemplateRenderer } from '../../engine/template.kit'
import { registerRenderer } from '../../engine/template.renderer'

registerRenderer(
  'folio',
  createTemplateRenderer({
    id: 'folio',
    headingFamily: 'SourceSerifPro',
    bodyFamily: 'Inter',
    defaultScale: {
      name: 35,
      headline: 11,
      sectionTitle: 10,
      entryTitle: 11,
      body: 10,
      small: 9,
      caption: 8,
    },
    marginMm: 18,
    header: 'editorial',
    sectionHeader: 'caps-rule',
    density: 'regular',
    uppercaseSectionTitles: true,
    titles: {
      summary: 'Profile',
      experience: 'Selected Experience',
    },
    defaultLineHeight: {
      heading: 1.2,
      body: 1.45,
    },
  })
)
